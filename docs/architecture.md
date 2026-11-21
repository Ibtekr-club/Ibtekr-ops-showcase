# Architecture — the backend in words

The production backend (Postgres schema, Row Level Security policies and Edge Functions) is not part of this
public repository. This page describes what it does, without its code or its policies. The web app in `app/`
talks to it through the Supabase client, and every write goes through a small adapter in `app/js/adapter/`.

The demo in this repository runs on an in-browser stand-in for the same backend (`tests/e2e/supabase-mock.mjs`
and the files it imports from `mock/shared/`): the same tables, the same permission rules and the same function
results, with made-up data.

## Overview

```
WooCommerce + Dokan (the shop)
   │  signed webhooks (HMAC)                ▲  REST writes (only from a person's action, behind a kill switch)
   ▼                                        │
Edge Functions (Deno) ──────────────────────┘
   │  service role, server-side checks
   ▼
Postgres + Row Level Security  ◄──── RTL web app (members sign in, every read and write is checked per role)
   │
   └─ Realtime broadcast ("something changed") → every open screen reloads that slice quietly
```

## Data (Postgres tables, grouped by area)

**Identity, roles and settings**
- `profiles` — one row per team member: name, contact, primary role, extra roles, level (manager / employee / viewer), manager.
- `roles` — the teams and their permission sets (one set per level).
- `invites`, `login_failures`, `login_lookups` — inviting members, and the sign-in lock after repeated wrong passwords.
- `settings` — system settings, one row per section (store, notifications, AI, HR, lists, brand, security …).
- `user_prefs`, `notification_prefs`, `quick_actions` — per-member preferences, notification choices and shortcuts.
- `status_map` — order statuses and how each maps to the shop's own status.
- `activity_log` — an append-only audit trail of who did what (ids, names and codes only — no message text, no money).
- `sync_state` — bookkeeping for scheduled jobs.

**Orders and the shop mirror**
- `orders`, `order_items`, `sub_orders` — orders synced from the shop, their lines, and the per-maker sub-orders created by the marketplace plugin.
- `order_events` — the timeline of each order (status, confirmation, notes).
- `customer_ratings`, `returns` — the team's rating of a customer when an order completes, and returns.
- `products`, `woo_categories`, `woo_brands`, `woo_states` — a read mirror of the shop's catalogue, categories, brands and regions.
- `product_commissions`, `product_lead_days` — per-product commission overrides and manufacturing time.
- `woo_sync_log`, `woo_webhook_events` — every sync run and every incoming webhook delivery (for replay and debugging).
- `bosta_pickups` — courier pickups requested from the system.

**Makers (vendors) and commissions**
- `vendors` — each maker: store link, status, contact, categories.
- `vendor_rates`, `vendor_category_rates` — the commission per maker, and per category, dated.
- `vendor_bank`, `vendor_logins`, `vendor_login_resets` — bank details and the maker portal sign-in (passwords live in a vault, never in a table).
- `brands`, `brand_owners`, `brand_rates` — brands and their ownership history.

**Accounts**
- `acc_expenses`, `acc_account_moves`, `acc_vendor_moves` — expenses, money in and out of each account, and money paid to or held from makers.
- `acc_vendor_settlements` — each payout settlement against a maker's balance.
- `acc_list_items` — editable lists (subscriptions, ad platforms).
- `dokan_balances`, `dokan_withdrawals` — a read mirror of each maker's balance and withdrawal requests on the shop.

**Inventory**
- `inv_locations`, `inv_lots`, `inv_moves` — places, pieces held, and an append-only movement ledger (quantities come from the moves only).
- `inv_consolidations`, `inv_consolidation_items` — gathering one order's pieces from several makers.
- `inv_counts`, `inv_count_lines` — stock counts and their reconciliation.

**Customer service**
- `cs_customers`, `cs_contacts`, `cs_customer_notes` — customers (created from orders automatically), their channel identities and notes.
- `cs_conversations`, `cs_messages`, `cs_posts` — conversations from WhatsApp, Messenger, Instagram and post comments.
- `cs_templates`, `cs_quick_replies`, `cs_auto_rules`, `cs_auto_runs` — templates, quick replies, auto-reply rules and their run log.
- `cs_segments`, `cs_campaigns`, `cs_campaign_recipients` — customer segments and broadcast campaigns.
- `cs_channels`, `cs_channel_events`, `cs_wa_state`, `cs_oauth_states`, `cs_carts`, `cs_rating_overrides`, `cs_team_ratings` — channel status, connection state, abandoned carts and ratings.

**Team requests (tickets)**
- `tickets`, `ticket_events` — internal requests between teams, with an append-only history.

**HR**
- `hr_members`, `hr_attendance`, `hr_requests`, `hr_overtime`, `hr_holidays`, `hr_leave_types` — staff records, flexible attendance sessions, leave and other requests, overtime and holidays.
- `hr_payroll`, `hr_payroll_lines`, `hr_payroll_paid`, `hr_adjustments`, `hr_pay`, `hr_bank` — monthly payroll, bonuses and deductions, and payouts.
- `hr_evaluations`, `hr_scores`, `hr_kpis`, `hr_tasks`, `hr_notes_log`, `hr_documents`, … — evaluations, tasks, manager notes and documents.

**Marketing and AI**
- `mkt_campaigns`, `mkt_templates`, `mkt_posts` — campaigns built in the system, design templates, and scheduled / published posts with their numbers.
- `mkt_ad_objects`, `mkt_ad_stats`, `mkt_suggestions` — ad accounts' campaigns and daily numbers, and the media buyer's suggestions.
- `mkt_video_jobs`, `mkt_trends`, `mkt_competitors`, `mkt_requests` — AI video jobs, trends, competitors and design requests.
- `ai_agents`, `ai_agent_kb`, `ai_agent_notes`, `mkt_agent_chats`, `mkt_agent_messages` — the AI assistants, their rules and skills, the notes they raise, and chats.
- `ai_runs` — one row per AI call, for spend caps and auditing.
- `studio_batches`, `sku_colors`, `sku_serial`, `shot_prompts`, `image_imports`, `image_shares` — the product studio's batches, SKU building and image pipeline.

**Alerts and checks**
- `alerts`, `alert_state`, `alert_reads` — the notification bell.
- `site_checks`, `company_docs` — site health checks and company documents.

## Edge Functions (Deno)

| Function | Job |
|---|---|
| `woo-webhook` | Receives the shop's signed webhooks (orders, products, stores) and writes them into the mirror. |
| `woo-sync` | Scheduled and on-demand sync with the shop, and the few writes the system is allowed to make there (order status, store details, products, withdrawal approval …), each one gated by permission and a global kill switch. |
| `ai-content` | Product copy, campaign copy, the header assistant and the AI assistants' chats (Claude). |
| `ai-images` | Product and campaign images, video jobs and the image-provider bridge. |
| `cs-channel` | Messenger / Instagram webhooks and replies. |
| `cs-whatsapp` | WhatsApp Cloud API webhooks, replies and template campaigns. |
| `cs-wa` | The bridge for a second WhatsApp number. |
| `cs-auto` | The auto-reply engine (order events, abandoned checkouts, first messages). |
| `notify` | The alert engine, daily summaries and scheduled clean-up. |
| `mkt-publish` | Publishing scheduled posts to Facebook and Instagram, and reading their numbers. |
| `mkt-ads` | Reading ad accounts (Meta, TikTok, Google) and acting on approved suggestions. |
| `team-admin` | Adding and removing team members and sending password e-mails. |
| `settings-admin` | Storing integration keys in the vault (never returned), and admin-only settings. |
| `portal` | The makers' portal: sign-in, their orders, balance and withdrawals. |
| `share-mail` | Sending a report (Excel / PDF) by e-mail from the system. |

## Permissions (how RLS splits them)

- Every table has Row Level Security on. Each rule asks one function, `has_perm(key, level)`, whether the signed-in member may act.
- Each permission key (for example `orders.status`, `accounts.view`, `sensitive.commission`) has three values: **F** (full), **P** (partial — only the member's own rows or their team's) and **N** (none).
- A member's permissions come from their primary role at their level (manager / employee / viewer), plus their extra roles, plus any per-member override. Admins have everything.
- Sensitive values (phone numbers, commission rates, salaries, bank details) are hidden from members without the matching `sensitive.*` permission — phone numbers are returned masked through a view.
- Writes that must follow business rules (closing a ticket, approving overtime, settling a maker's balance …) go through `security definer` database functions that check the rule and the permission, never through a direct table write.
- When two-factor authentication is enforced, a session that has not completed it has no permissions at all.

## Sync and webhooks

1. **Shop → system.** The shop sends a signed webhook for each order / product / store change. `woo-webhook` checks the signature and the source site, stores the delivery, and upserts the mirror. A scheduled `woo-sync` run catches anything a webhook missed.
2. **System → shop.** Only a person's action can write to the shop (a status change, store details, a product edit). Each write checks the member's permission on the server and a global switch, and is logged.
3. **Live screens.** A trigger on each table group sends a small "changed" signal on a private Realtime channel; open screens reload that slice quietly — without touching a form someone is typing in. Writes that two members could make at once carry the value the writer saw, so a stale write is refused instead of overwriting.
4. **Secrets.** Integration keys live in the database vault and are read only by the Edge Functions; the browser only ever sees the public key.
