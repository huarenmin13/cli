# base
> skill: lark-base

## +record-list

### Examples

**Project a field whose name contains spaces**
```bash
lark-cli base +record-list --base-token <base_token> --table-id <table_id> --field-id "Project Owner" --limit 50
```

## +record-history-list
Use this when the intended record is known and its change history is needed.

### Prerequisites
- Pass the `record_id` for the intended row. If the user identifies a row by its position in a view, resolve that position with [[+record-list]] first and follow the related skill reference for the exact output field.

### Tips
- This command reads one record's history; it does not infer a record or perform a table-wide audit.
- `--format pretty` renders local timestamps with their UTC offset, operators, and field changes. Omit it to preserve the default JSON envelope.

### Examples

**Read one record's history**
```bash
lark-cli base +record-history-list --base-token <base_token> --table-id <table_id> --record-id <record_id>
```

**Render one record's history for a human reader**
```bash
lark-cli base +record-history-list --base-token <base_token> --table-id <table_id> --record-id <record_id> --format pretty
```

### Skills
- `lark-base/references/lark-base-record-history-list.md`
