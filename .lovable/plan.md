

## Problem

From the screenshot, there are two issues with the label templates UI:

1. **Leg fields show raw paths** — "Noga skrzynia" and "Noga siedzisko" rows show `leg.code`, `leg.height`, `leg.count` as badges. These are old/incorrect field paths saved in the DB that don't match the current `COMPONENT_FIELDS` definitions (which use `legHeights.sofa_chest.leg` etc.). The DisplayFieldsSelector can't find a matching label, so it falls back to showing the raw value.

2. **Condition field is read-only** — The "Warunkowa" column only displays the current `condition_field` value as a static badge. There's no UI to toggle `is_conditional` or edit the `condition_field` path.

**How conditions work**: When `is_conditional = true` and `condition_field` is set (e.g. `legHeights.sofa_seat`), the label generator checks if that field exists and has a value in the decoded SKU. If it's empty/null, the label is skipped. This must be set manually — it doesn't auto-populate.

## Plan

### 1. Make condition field editable in LabelTemplates.tsx

Replace the static badge in the "Warunkowa" column with an interactive control:
- A small toggle/checkbox for `is_conditional`
- When enabled, show a text input or dropdown to set `condition_field` (using available field paths from `DisplayFieldsSelector`'s `COMPONENT_FIELDS`)
- Save changes via the existing `updateMutation`

### 2. Fix stale leg field values in DB

The stored `display_fields` values (`leg.code`, `leg.height`, `leg.count`) are outdated. Two options:
- **Quick fix**: Add these old paths as aliases in `resolveField` so they still work
- **Better fix**: The admin can re-select correct fields from the dropdown (which already has the right paths). After making conditions editable, the admin can also fix these manually.

I'll add the old `leg.*` paths to the `leg_chest` and `leg_seat` field definitions in `DisplayFieldsSelector` so existing templates don't break, and the labels render correctly.

### Files to edit

- `src/pages/AdminPanel/LabelTemplates.tsx` — add editable condition toggle + field input
- `src/pages/AdminPanel/labels/DisplayFieldsSelector.tsx` — add backward-compatible `leg.*` aliases to leg component fields

