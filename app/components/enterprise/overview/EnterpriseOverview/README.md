# EnterpriseOverview

## Purpose

The Enterprise Overview component provides a consolidated operational summary for an EPEW-EDE-IBOS administration module.

It is displayed beneath the KPI grid and above Quick Actions.

## Components

- EnterpriseOverview
- OverviewCard
- OverviewItem

## Supported Features

- Responsive columns
- Icons
- Operational status badges
- Trends
- Links and button actions
- Loading states
- Empty states
- Color variants
- Compact mode
- Accessibility labels

## Variants

- emerald
- gold
- blue
- purple
- red
- slate

## Statuses

- excellent
- healthy
- active
- pending
- warning
- critical
- offline
- neutral

## Example

```tsx
<EnterpriseOverview
  title="Communication Overview"
  description="Current communication operations across the EPEW ecosystem."
  columns={6}
  items={[
    {
      label: "Official Contacts",
      value: "12,845",
      variant: "emerald",
      status: "healthy",
    },
    {
      label: "Organizations",
      value: 317,
      variant: "blue",
      status: "active",
    },
  ]}
/>