import base64
import json
import sys
import time
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression

from features import matrix

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "eval" / "smartsort" / "v1"
PRE = json.loads((DATA / "preregistration.json").read_text(encoding="utf-8"))


def load(split):
    rows = [json.loads(line) for line in (DATA / f"{split}.jsonl").read_text(encoding="utf-8").splitlines()]
    rules = {item["id"]: item for item in json.loads((DATA / f"rules_{split}.json").read_text(encoding="utf-8"))}
    for row in rows:
        row["rules"] = rules[row["id"]]
    return [row for row in rows if row["label"] != "otp"]


def category_rows(rows):
    return [row for row in rows if row["task"] == "category"]


def suggestions(predicted, truth):
    made = [(p, t) for p, t in zip(predicted, truth) if p != "Other"]
    correct = sum(1 for p, t in made if p == t)
    labelled = sum(1 for t in truth if t != "Other")
    covered = sum(1 for p, t in zip(predicted, truth) if p != "Other" and t != "Other")
    labels = sorted(set(truth) | set(predicted))
    f1s = []
    for label in labels:
        tp = sum(1 for p, t in zip(predicted, truth) if p == label and t == label)
        fp = sum(1 for p, t in zip(predicted, truth) if p == label and t != label)
        fn = sum(1 for p, t in zip(predicted, truth) if p != label and t == label)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        if label in truth:
            f1s.append(2 * precision * recall / (precision + recall) if precision + recall else 0.0)
    return {
        "accuracy": round(sum(1 for p, t in zip(predicted, truth) if p == t) / len(truth), 4),
        "macro_f1": round(float(np.mean(f1s)), 4),
        "suggestion_precision": round(correct / len(made), 4) if made else None,
        "coverage": round(covered / labelled, 4) if labelled else None,
        "suggestions": len(made),
        "rows": len(truth),
    }


def fit_category(train, dim, c):
    x = matrix([(row["text"], row["rules"]["merchant"]) for row in train], dim)
    y = [row["label"] for row in train]
    model = LogisticRegression(C=c, max_iter=3000)
    model.fit(x, y)
    return model


def predict_category(model, rows, dim, threshold):
    x = matrix([(row["text"], row["rules"]["merchant"]) for row in rows], dim)
    probs = model.predict_proba(x)
    out = []
    for row_probs in probs:
        index = int(np.argmax(row_probs))
        label = model.classes_[index]
        out.append(label if row_probs[index] >= threshold else "Other")
    return out, probs


def hybrid(rules, model_out):
    return [r if r != "Other" else m for r, m in zip(rules, model_out)]


def fit_gate(train, dim, c):
    x = matrix([(row["text"], "") for row in train], dim, use_merchant=False)
    y = [1 if row["financial"] else 0 for row in train]
    model = LogisticRegression(C=c, max_iter=3000)
    model.fit(x, y)
    return model


def gate_metrics(model, rows, dim, threshold):
    x = matrix([(row["text"], "") for row in rows], dim, use_merchant=False)
    p = model.predict_proba(x)[:, 1]
    rejected = [not row["rules"]["parsed"] for row in rows]
    missed = [i for i, row in enumerate(rows) if row["financial"] and rejected[i]]
    negatives = [i for i, row in enumerate(rows) if not row["financial"]]
    caught = sum(1 for i in missed if p[i] >= threshold)
    false_flags = sum(1 for i in negatives if rejected[i] and p[i] >= threshold)
    accepted_negatives = sum(1 for i in negatives if not rejected[i])
    return {
        "rule_missed_transactions": len(missed),
        "rule_missed_recall": round(caught / len(missed), 4) if missed else None,
        "negatives": len(negatives),
        "false_flag_rate": round(false_flags / len(negatives), 4) if negatives else None,
        "rules_false_accepts": accepted_negatives,
        "threshold": threshold,
    }


def tune():
    train, val = load("train"), load("val")
    ctrain, cval = category_rows(train), category_rows(val)
    truth = [row["label"] for row in cval]
    r2 = [row["rules"]["r2_any"] for row in cval]
    report = {"val_rules": {"R1": suggestions([row["rules"]["r1_any"] for row in cval], truth), "R2": suggestions(r2, truth)}, "category": [], "gate": []}
    for dim in (4096, 8192, 16384):
        for c in (1.0, 4.0, 16.0):
            model = fit_category(ctrain, dim, c)
            for threshold in (0.3, 0.4, 0.5, 0.6, 0.7, 0.8):
                out, _ = predict_category(model, cval, dim, threshold)
                report["category"].append({"dim": dim, "C": c, "threshold": threshold, "M": suggestions(out, truth), "R2+M": suggestions(hybrid(r2, out), truth)})
            gate = fit_gate(train, dim, c)
            for threshold in (0.5, 0.7, 0.8, 0.9, 0.95):
                report["gate"].append({"dim": dim, "C": c, **gate_metrics(gate, val, dim, threshold)})
    (DATA / "tuning_val.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["val_rules"], indent=1))
    viable = [item for item in report["category"] if (item["R2+M"]["suggestion_precision"] or 0) >= PRE["category_ship_gate"]["minimum_suggestion_precision"]]
    viable.sort(key=lambda item: (item["R2+M"]["coverage"], -item["dim"]), reverse=True)
    for item in viable[:5]:
        print("cat", item["dim"], item["C"], item["threshold"], item["R2+M"], "M", item["M"]["suggestion_precision"], item["M"]["coverage"])
    gates = [item for item in report["gate"] if item["false_flag_rate"] is not None and item["false_flag_rate"] <= PRE["gate_ship_gate"]["maximum_false_flag_rate_on_negatives"]]
    gates.sort(key=lambda item: (item["rule_missed_recall"] or 0, -item["dim"]), reverse=True)
    for item in gates[:5]:
        print("gate", item)


def export(model, dim, path, kind):
    weights = model.coef_.astype(np.float32)
    scale = np.abs(weights).max(axis=1) / 127.0
    scale[scale == 0] = 1.0
    quantized = np.clip(np.round(weights / scale[:, None]), -127, 127).astype(np.int8)
    payload = {
        "format": "cashweft-smartsort-1",
        "kind": kind,
        "dim": dim,
        "classes": [str(label) for label in model.classes_],
        "scale": [float(value) for value in scale],
        "bias": [float(value) for value in model.intercept_],
        "weights": base64.b64encode(quantized.tobytes()).decode("ascii"),
    }
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path.stat().st_size


def final(dim, c, threshold, gate_dim, gate_c, gate_threshold):
    train, test = load("train") + load("val"), load("test")
    ctrain, ctest = category_rows(train), category_rows(test)
    truth = [row["label"] for row in ctest]
    started = time.perf_counter()
    model = fit_category(ctrain, dim, c)
    train_seconds = time.perf_counter() - started
    out, probs = predict_category(model, ctest, dim, threshold)
    r1 = [row["rules"]["r1_any"] for row in ctest]
    r2 = [row["rules"]["r2_any"] for row in ctest]
    gate = fit_gate(train, gate_dim, gate_c)
    model_dir = DATA / "model"
    model_dir.mkdir(exist_ok=True)
    size = export(model, dim, model_dir / "category.json", "category")
    gate_size = export(gate, gate_dim, model_dir / "gate.json", "gate")
    per_family = {}
    for family in sorted({row["family"] for row in ctest}):
        idx = [i for i, row in enumerate(ctest) if row["family"] == family]
        per_family[family] = {name: suggestions([pred[i] for i in idx], [truth[i] for i in idx]) for name, pred in (("R1", r1), ("R2", r2), ("R2+M", hybrid(r2, out)))}
    parsed_rows = [row for row in ctest if row["rules"]["parsed"]]
    result = {
        "config": {"dim": dim, "C": c, "threshold": threshold, "gate_dim": gate_dim, "gate_C": gate_c, "gate_threshold": gate_threshold},
        "train_seconds": round(train_seconds, 2),
        "category_test": {"R1": suggestions(r1, truth), "R2": suggestions(r2, truth), "M": suggestions(out, truth), "R2+M": suggestions(hybrid(r2, out), truth)},
        "category_test_end_to_end_parsed_only": {
            "parsed": len(parsed_rows),
            "R1": suggestions([row["rules"]["r1"] for row in parsed_rows], [row["label"] for row in parsed_rows]),
            "R2": suggestions([row["rules"]["r2"] for row in parsed_rows], [row["label"] for row in parsed_rows]),
        },
        "per_family": per_family,
        "gate_test": gate_metrics(gate, test, gate_dim, gate_threshold),
        "model_bytes": {"category_json": size, "gate_json": gate_size},
    }
    (DATA / "results_test.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    sample = [{"id": row["id"], "text": row["text"], "merchant": row["rules"]["merchant"], "top": str(model.classes_[int(np.argmax(p))]), "p": float(np.max(p))} for row, p in list(zip(ctest, probs))[:200]]
    (DATA / "parity_sample.json").write_text(json.dumps(sample, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({key: result[key] for key in ("category_test", "category_test_end_to_end_parsed_only", "gate_test", "model_bytes")}, indent=1))


if __name__ == "__main__":
    if sys.argv[1] == "tune":
        tune()
    else:
        final(int(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7]))
