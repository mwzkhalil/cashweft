# OpenJev provenance

This note is research history. Cashweft does not ship OpenJev, Gemma, or any other model. The app does not download weights and does not score SMS with a model. Money Threads uses deterministic checks only.

Checked against the Hugging Face Hub on 10 October 2026. On 11 October 2026 the same hashes were recomputed from the local checkpoint at `D:\g\openjev-0.8b\qwen3.5-0.8b-nli-v2s-long`. The weight file matches the pinned Git LFS SHA-256. The weights were not copied into this repository.

| Field | Value |
| --- | --- |
| Repository | `AlexWortega/openjev` |
| Checkpoint | `qwen3.5-0.8b-nli-v2s-long` |
| Revision | `a20448012c213128955ca0c693e7c943865cab77` |
| Hub `lastModified` | 2026-10-01T09:47:38Z |
| Gated | no |
| Card license | MIT |
| Architecture | `Qwen3_5ForSequenceClassification` |
| Task | single-label classification: contradiction, entailment, neutral |
| Template | `Premise: {premise}\nHypothesis: {hypothesis}` |
| Weights dtype | bfloat16 |
| Context used by the publisher for this checkpoint | 4096 tokens (`train_result.json` `max_len`) |
| Config `max_position_embeddings` | 262144 |
| Language on the model card | English |
| `model.safetensors` size | 1,706,036,760 bytes |
| `model.safetensors` SHA-256 | `cf6d62a341c0c804f9a926eec71aefc9859adb28978736e757b49bce35d9b8f8` |
| `tokenizer.json` size | 19,989,424 bytes |
| `tokenizer.json` SHA-256 | `d73c2c5f7aa0ed522c8d96ef3524739eb61e3c78e74839a2ce4a1c56ea340a20` |

The repository card lists `base_model: Qwen/Qwen3.5-4B`. The chosen folder is the 0.8B student. Its training record starts from `ckpt/qwen3.5-0.8b-nli-v2s-jev` and names `Qwen/Qwen3.5-4B` only as the image processor. Cashweft does not use the vision tower.

`Qwen/Qwen3.5-0.8B` is published as Apache-2.0. If a later build redistributes these weights, keep the OpenJev MIT notice and the Qwen Apache-2.0 `LICENSE`, plus any `NOTICE` file shipped with the Qwen checkpoint. This APK does not contain the weights.

Source links:

- Checkpoint: https://huggingface.co/AlexWortega/openjev/tree/a20448012c213128955ca0c693e7c943865cab77/qwen3.5-0.8b-nli-v2s-long
- Qwen3.5 0.8B: https://huggingface.co/Qwen/Qwen3.5-0.8B
- Qwen license: https://huggingface.co/Qwen/Qwen3.5-0.8B/blob/main/LICENSE
- Apache-2.0: https://www.apache.org/licenses/LICENSE-2.0

Quantization: none. Modifications: none. These weights are not in the Cashweft app. The unused native model stub was removed from the app.

## Local verification

`tools/jev/verify_source_model.py` opened `model.safetensors` with `safetensors` and counted 474 tensors. No partial or temporary file was treated as the model.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `model.safetensors` | 1,706,036,760 | `cf6d62a341c0c804f9a926eec71aefc9859adb28978736e757b49bce35d9b8f8` |
| `config.json` | 3,049 | `3b914561e53dad38981a498af0b0bf430300be9d3e5fa3cd7b10c2049c073e52` |
| `tokenizer.json` | 19,989,424 | `d73c2c5f7aa0ed522c8d96ef3524739eb61e3c78e74839a2ce4a1c56ea340a20` |
| `tokenizer_config.json` | 1,233 | `289d88d849f89fcf0f9c145773122f6718095cd4aee05435afbd0293569c7085` |
| `chat_template.jinja` | 7,755 | `273d8e0e683b885071fb17e08d71e5f2a5ddfb5309756181681de4f5a1822d80` |

`preprocessor_config.json` and `video_preprocessor_config.json` are on disk from an earlier snapshot. Text classification does not use them.

Tooling used to load the checkpoint: `huggingface_hub` 2.2.0, `hf_xet` 1.7.0, `safetensors` 0.8.0, `transformers` 5.19.0, `tokenizers` 0.23.3, `torch` 2.13.0+cpu. Transformers 5.9.0 refused Hub 2.2, so Transformers was upgraded before the load. The load used `local_files_only=True` and `HF_HUB_OFFLINE=1`.

The loaded config says `num_labels` 3, `id2label` `{0: contradiction, 1: entailment, 2: neutral}`, and `nli_template` `Premise: {premise}\nHypothesis: {hypothesis}`. The module dtype was `torch.bfloat16`.

CPU probe, one premise, two hypotheses. Raw logits are `[contradiction, entailment, neutral]`. Saved in `eval/money_threads/bf16_probe.json`.

Premise: Transaction A is a PKR 10,000 debit from the user's HBL account. Two minutes later Transaction B is a PKR 10,000 credit into the user's JazzCash account. Both accounts are marked as owned by the user.

| Hypothesis | Logits | Probabilities | Predicted |
| --- | --- | --- | --- |
| These transactions represent a transfer between accounts owned by the same person. | -2.78125, 3.4375, -0.126953125 | contradiction 0.001933, entailment 0.970587, neutral 0.027480 | entailment |
| These transactions are unrelated purchases at two different shops on different days. | 0.91796875, -2.59375, 3.015625 | contradiction 0.108969, entailment 0.003252, neutral 0.887778 | neutral |

Linear-attention kernels were the PyTorch reference path. `causal_conv1d` and `flash-linear-attention` were not installed. The whole process, including the weight load and both forwards, finished in 46.7 seconds. That figure is not a per-call latency.

## What was not produced

No quantized file was built. ExecuTorch is not installed and no `.pte` file exists. There is no measured phone download size, on-device latency, or peak RAM. The app does not download this file.
