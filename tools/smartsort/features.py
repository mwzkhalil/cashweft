import re
import unicodedata

import numpy as np
from scipy.sparse import csr_matrix

DIGITS = re.compile(r"[0-9\u0660-\u0669\u06F0-\u06F9]+")
WORDS = re.compile(r"[a-z0-9\u0600-\u06ff]+")


def fnv1a(text):
    value = 0x811C9DC5
    for byte in text.encode("utf-8"):
        value ^= byte
        value = (value * 0x01000193) & 0xFFFFFFFF
    return value


def clean(text):
    text = unicodedata.normalize("NFKC", text).lower()
    return DIGITS.sub("0", text)


def grams(text, prefix):
    words = WORDS.findall(clean(text))
    out = []
    for index, word in enumerate(words):
        out.append(f"{prefix}w:{word}")
        if index:
            out.append(f"{prefix}b:{words[index - 1]} {word}")
        padded = f"<{word}>"
        for size in (2, 3, 4):
            for start in range(0, max(0, len(padded) - size) + 1):
                out.append(f"{prefix}c:{padded[start:start + size]}")
    return out


def featurize(body, merchant, dim):
    counts = {}
    for item in grams(body, "") + grams(merchant or "", "m"):
        key = fnv1a(item) % dim
        counts[key] = counts.get(key, 0) + 1
    return counts


def matrix(rows, dim, use_merchant=True):
    data, cols, indptr = [], [], [0]
    for body, merchant in rows:
        counts = featurize(body, merchant if use_merchant else "", dim)
        norm = np.sqrt(sum(value * value for value in counts.values())) or 1.0
        for key in sorted(counts):
            cols.append(key)
            data.append(counts[key] / norm)
        indptr.append(len(cols))
    return csr_matrix((np.array(data, dtype=np.float32), np.array(cols), np.array(indptr)), shape=(len(rows), dim))
