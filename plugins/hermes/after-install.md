# Hakim installed for Hermes

Hakim was installed as a native Hermes plugin.

Enable it when you are ready:

```bash
hermes plugins enable hakim
```

Then start a fresh Hermes session and verify:

```text
/plugins
/hakim-help
```

Primary commands:

```text
/hakim [lite|full|ultra|off] [task]
/hakim-review [scope]
/hakim-audit [scope]
/hakim-debt [scope]
/hakim-gain [scope]
/hakim-help
```

Hakim registers no tools, no MCP server, no credentials, and no built-in tool overrides. Hermes plugin enablement, permissions, approvals, and host security controls remain authoritative.
