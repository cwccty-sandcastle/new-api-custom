# new-api

AI API gateway context. This glossary fixes the vocabulary for usage logs, prompt-cache accounting, and the analytics surfaces built on them.

## Language

### Prompt cache

**缓存命中 token**:
Input tokens served from the upstream prompt cache instead of being reprocessed. Also called cache read tokens.
_Avoid_: 缓存 token, cached token, 命中 token

**缓存写入 token**:
Input tokens newly stored into the upstream prompt cache (Anthropic cache creation, OpenAI cache write). Counted as a cache miss, not a hit.
_Avoid_: 创建缓存, creation token

**新鲜输入 token**:
Input tokens processed without any prompt-cache involvement: total input minus cache hit minus cache write, clamped at zero. The only quantity that is directly comparable across providers.
_Avoid_: 未命中 token, fresh token

**总输入 token**:
Every input token a request processes: fresh, uncached input plus cache write plus cache hit. Providers report it differently — OpenAI and Gemini fold cache hit into the reported input count, Claude reports fresh input only and lists cache read and cache write separately.
_Avoid_: prompt_tokens (when used as if provider-neutral), 输入 token

**缓存命中率**:
Cache hit tokens divided by total input tokens for the same scope (one request, or an aggregation). Range 0–100%; undefined when total input is zero.
_Avoid_: 缓存命中 (ambiguous), 命中率

### Other caches (not prompt cache)

**渠道亲和性缓存**:
Routing state that keeps a token or user pinned to a channel. Unrelated to prompt-cache accounting.
_Avoid_: 缓存 (unqualified), cache

**磁盘缓存**:
On-disk storage for request bodies and upstream responses. Unrelated to prompt-cache accounting.
_Avoid_: 缓存 (unqualified), cache
