# OpenJev provenance

Checked against the Hugging Face Hub on 10 October 2026. Hashes below are the Git LFS SHA-256 values published by the Hub for revision `a20448012c213128955ca0c693e7c943865cab77`. They were not recomputed from a local download.

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

Quantization: none. Modifications: none. Runtime in Cashweft 1.0.1: the `CashweftJev` module does not load these weights.

## What was not produced

No quantized file was built. `Qwen3_5ForSequenceClassification` uses hybrid linear attention and full attention. ONNX Runtime Mobile and ExecuTorch were not shown to load this graph, so there is no measured INT8 or INT4 artifact, no quantized SHA-256, and no on-device latency or RAM number. The 1.7 GB bfloat16 file is not downloaded by the app.

Cashweft’s relationship cards run from the deterministic checks in `mobile/src/finance/threads/decide.ts`. The native module `CashweftJev` reports that the phone pack is not published and does not score text.
