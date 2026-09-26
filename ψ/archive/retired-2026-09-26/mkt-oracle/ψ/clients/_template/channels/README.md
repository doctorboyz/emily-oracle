# Channel Configurations

| ไฟล์ | หน้าที่ |
|------|---------|
| `<platform>.md` | Platform connection config |

## Platform Config Template

```yaml
---
platform: <twitter|instagram|tiktok|facebook|linkedin|youtube>
client: <client-slug>
status: connected | pending | disconnected
updated: YYYY-MM-DD
---
## Account Info
- Handle: @
- Account type: personal | business | creator

## Connection Method
- MCP tool: <tool-name>
- Auth: OAuth | API key | manual

## Posting Rules
- Frequency: X per day/week
- Best times: <times>
- Auto-approve: <yes|no>

## Content Rules
- Max length: <chars>
- Hashtag strategy: <strategy>
- Media requirements: <specs>
```