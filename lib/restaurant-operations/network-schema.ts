export type NetworkField = { key: string; label: string; type: string; required: boolean; options?: string[] };
export const networkSchemas: Record<string, {label:string;fields:NetworkField[]}> = {
  "menu": {
    "label": "Opening menu",
    "fields": [
      {
        "key": "menu_item_id",
        "label": "Menu Item ID",
        "type": "text",
        "required": true
      },
      {
        "key": "recipe_id",
        "label": "Food Fans Recipe ID",
        "type": "text",
        "required": false
      },
      {
        "key": "category",
        "label": "Category",
        "type": "text",
        "required": false
      },
      {
        "key": "name",
        "label": "Name",
        "type": "text",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "type": "textarea",
        "required": false
      },
      {
        "key": "active",
        "label": "Active",
        "type": "boolean",
        "required": false
      },
      {
        "key": "signature_item",
        "label": "Signature item",
        "type": "boolean",
        "required": false
      },
      {
        "key": "meal_periods",
        "label": "Breakfast / lunch / dinner",
        "type": "text",
        "required": false
      },
      {
        "key": "pickup",
        "label": "Available for pickup",
        "type": "boolean",
        "required": false
      },
      {
        "key": "delivery",
        "label": "Available for delivery",
        "type": "boolean",
        "required": false
      },
      {
        "key": "qualifying_rewards_meal",
        "label": "Qualifying Rewards meal",
        "type": "boolean",
        "required": false
      },
      {
        "key": "vegan",
        "label": "Vegan",
        "type": "boolean",
        "required": false
      },
      {
        "key": "vegetarian",
        "label": "Vegetarian",
        "type": "boolean",
        "required": false
      },
      {
        "key": "allergens",
        "label": "Allergens \u2014 unknown until reviewed",
        "type": "textarea",
        "required": false
      },
      {
        "key": "pos_item_id",
        "label": "POS item ID",
        "type": "text",
        "required": false
      },
      {
        "key": "kitchen_station",
        "label": "Kitchen station",
        "type": "text",
        "required": false
      },
      {
        "key": "version",
        "label": "Recipe/menu version label",
        "type": "text",
        "required": true
      }
    ]
  },
  "recipe": {
    "label": "Recipe standards",
    "fields": [
      {
        "key": "recipe_id",
        "label": "Recipe ID",
        "type": "text",
        "required": true
      },
      {
        "key": "menu_item_id",
        "label": "Menu Item ID",
        "type": "text",
        "required": false
      },
      {
        "key": "ingredients",
        "label": "Ingredients and quantities",
        "type": "textarea",
        "required": false
      },
      {
        "key": "batch_quantity",
        "label": "Batch quantity",
        "type": "text",
        "required": false
      },
      {
        "key": "batch_yield",
        "label": "Batch yield",
        "type": "text",
        "required": false
      },
      {
        "key": "preparation_method",
        "label": "Preparation method",
        "type": "textarea",
        "required": false
      },
      {
        "key": "portion",
        "label": "Portion",
        "type": "text",
        "required": false
      },
      {
        "key": "holding_method",
        "label": "Holding method",
        "type": "textarea",
        "required": false
      },
      {
        "key": "cooking_temperature",
        "label": "Cooking temperature and unit \u2014 pending validation",
        "type": "text",
        "required": false
      },
      {
        "key": "packaging",
        "label": "Packaging",
        "type": "textarea",
        "required": false
      },
      {
        "key": "modifiers",
        "label": "Modifiers",
        "type": "textarea",
        "required": false
      },
      {
        "key": "allergens",
        "label": "Allergens \u2014 unknown until reviewed",
        "type": "textarea",
        "required": false
      },
      {
        "key": "kitchen_station",
        "label": "Kitchen station",
        "type": "text",
        "required": false
      },
      {
        "key": "version",
        "label": "Recipe version",
        "type": "text",
        "required": true
      },
      {
        "key": "approval_status",
        "label": "Approval status",
        "type": "select",
        "required": true,
        "options": [
          "draft",
          "pending",
          "approved",
          "rejected"
        ]
      },
      {
        "key": "approved_by",
        "label": "Approved by",
        "type": "text",
        "required": false
      },
      {
        "key": "approval_date",
        "label": "Approval date",
        "type": "date",
        "required": false
      }
    ]
  },
  "website": {
    "label": "Website release register",
    "fields": [
      {
        "key": "work_id",
        "label": "Website Work ID",
        "type": "text",
        "required": true
      },
      {
        "key": "github_pr",
        "label": "GitHub PR URL",
        "type": "url",
        "required": false
      },
      {
        "key": "branch",
        "label": "Branch",
        "type": "text",
        "required": false
      },
      {
        "key": "commit",
        "label": "Commit",
        "type": "text",
        "required": false
      },
      {
        "key": "review_status",
        "label": "Review status",
        "type": "text",
        "required": false
      },
      {
        "key": "staging_deployment",
        "label": "Staging deployment URL",
        "type": "url",
        "required": false
      },
      {
        "key": "staging_qa",
        "label": "Staging QA evidence / status",
        "type": "textarea",
        "required": false
      },
      {
        "key": "mobile_qa",
        "label": "Mobile QA evidence / status",
        "type": "textarea",
        "required": false
      },
      {
        "key": "desktop_qa",
        "label": "Desktop QA evidence / status",
        "type": "textarea",
        "required": false
      },
      {
        "key": "language_qa",
        "label": "Language QA evidence / status",
        "type": "textarea",
        "required": false
      },
      {
        "key": "samuel_approval",
        "label": "Samuel approval evidence / pending",
        "type": "textarea",
        "required": false
      },
      {
        "key": "production_deployment",
        "label": "Production deployment URL",
        "type": "url",
        "required": false
      }
    ]
  },
  "drawing": {
    "label": "Independent anniversary drawings",
    "fields": [
      {"key":"rules_approved","label":"ORGDH rules approved with reference","type":"boolean","required":false},
      {
        "key": "drawing_id",
        "label": "ORGDH drawing ID",
        "type": "text",
        "required": true
      },
      {
        "key": "raffle_year",
        "label": "Raffle year",
        "type": "number",
        "required": true
      },
      {
        "key": "draw_at",
        "label": "Drawing date/time with UTC offset (e.g. -05:00)",
        "type": "text",
        "required": true
      },
      {
        "key": "rules_reference",
        "label": "Approved ORGDH rules reference",
        "type": "text",
        "required": true
      },
      {
        "key": "venue",
        "label": "Venue / TBA",
        "type": "text",
        "required": false
      },
      {
        "key": "notes",
        "label": "Notes",
        "type": "textarea",
        "required": false
      }
    ]
  },
  "raffle": {
    "label": "ORGDH confirmations",
    "fields": [
      {
        "key": "member_id",
        "label": "Member ID",
        "type": "text",
        "required": true
      },
      {
        "key": "drawing_id",
        "label": "ORGDH drawing ID",
        "type": "text",
        "required": true
      },
      {
        "key": "raffle_year",
        "label": "Raffle year",
        "type": "number",
        "required": true
      },
      {
        "key": "eligible",
        "label": "Eligible (verified by ORGDH)",
        "type": "boolean",
        "required": false
      },
      {
        "key": "opted_in",
        "label": "Opted in",
        "type": "boolean",
        "required": false
      },
      {
        "key": "entry_confirmed",
        "label": "Entry confirmed by ORGDH",
        "type": "boolean",
        "required": false
      },
      {
        "key": "date_entered",
        "label": "Date entered (ISO timestamp with offset)",
        "type": "text",
        "required": false
      },
      {
        "key": "orgdh_reference_id",
        "label": "ORGDH reference ID",
        "type": "text",
        "required": false
      },
      {
        "key": "confirmed_ticket_count",
        "label": "ORGDH-confirmed ticket count (optional)",
        "type": "number",
        "required": false
      },
      {
        "key": "notes",
        "label": "Notes",
        "type": "textarea",
        "required": false
      }
    ]
  },
  "membership": {
    "label": "Paid membership levels",
    "fields": [
      {
        "key": "member_id",
        "label": "Member ID",
        "type": "text",
        "required": true
      },
      {
        "key": "level",
        "label": "Paid membership level",
        "type": "select",
        "required": true,
        "options": [
          "MEMBER",
          "ELITE",
          "AMBASSADOR"
        ]
      },
      {
        "key": "state_code",
        "label": "ELITE state (two-letter code)",
        "type": "text",
        "required": false
      },
      {
        "key": "starts_at",
        "label": "Starts at (ISO timestamp with offset)",
        "type": "text",
        "required": true
      },
      {
        "key": "expires_at",
        "label": "Expires at (ISO timestamp with offset)",
        "type": "text",
        "required": true
      },
      {
        "key": "payment_reference",
        "label": "Verified payment / ORGDH reference (no collection here)",
        "type": "text",
        "required": true
      },
      {
        "key": "notes",
        "label": "Notes",
        "type": "textarea",
        "required": false
      }
    ]
  },
  "order": {
    "label": "Order integration register",
    "fields": [
      {
        "key": "order_id",
        "label": "Order ID",
        "type": "text",
        "required": true
      },
      {
        "key": "member_id",
        "label": "Member ID if applicable",
        "type": "text",
        "required": false
      },
      {
        "key": "channel",
        "label": "Order channel",
        "type": "select",
        "required": true,
        "options": [
          "counter",
          "online_pickup",
          "food_fans_delivery",
          "third_party_delivery"
        ]
      },
      {
        "key": "ordered_at",
        "label": "Order date/time (ISO timestamp with offset)",
        "type": "text",
        "required": true
      },
      {
        "key": "qualifying_meal_quantity",
        "label": "Verified qualifying meal quantity",
        "type": "number",
        "required": true
      },
      {
        "key": "reward_used",
        "label": "Reward used",
        "type": "boolean",
        "required": false
      },
      {
        "key": "order_status",
        "label": "Order status",
        "type": "select",
        "required": true,
        "options": [
          "pending",
          "completed",
          "canceled",
          "refunded"
        ]
      },
      {
        "key": "pos_order_reference",
        "label": "POS order reference",
        "type": "text",
        "required": false
      },
      {
        "key": "marketplace_order_reference",
        "label": "Marketplace order reference",
        "type": "text",
        "required": false
      },
      {
        "key": "verification_reference",
        "label": "Receipt / source verification",
        "type": "text",
        "required": true
      }
    ]
  },
  "location": {
    "label": "Verified restaurant geography",
    "fields": [
      {
        "key": "state_code",
        "label": "State code",
        "type": "text",
        "required": true
      },
      {
        "key": "country_code",
        "label": "Country code",
        "type": "text",
        "required": true
      },
      {
        "key": "latitude",
        "label": "Verified latitude",
        "type": "number",
        "required": false
      },
      {
        "key": "longitude",
        "label": "Verified longitude",
        "type": "number",
        "required": false
      },
      {
        "key": "operating",
        "label": "Currently operating / serving",
        "type": "boolean",
        "required": false
      },
      {
        "key": "evidence",
        "label": "Location verification source",
        "type": "text",
        "required": true
      }
    ]
  },
  "zip_service": {
    "label": "ZIP service / expansion review",
    "fields": [
      {
        "key": "zip_code",
        "label": "ZIP code",
        "type": "text",
        "required": true
      },
      {
        "key": "nearest_location",
        "label": "Verified nearest restaurant unit",
        "type": "text",
        "required": false
      },
      {
        "key": "served",
        "label": "Currently served",
        "type": "select",
        "required": true,
        "options": [
          "unknown",
          "yes",
          "no"
        ]
      },
      {
        "key": "expansion_flag",
        "label": "Expansion review",
        "type": "select",
        "required": true,
        "options": [
          "unreviewed",
          "review",
          "not_flagged"
        ]
      },
      {
        "key": "evidence",
        "label": "Service area / distance verification source",
        "type": "text",
        "required": true
      }
    ]
  },
  "portal_link": {
    "label": "Verified member portal access",
    "fields": [
      {
        "key": "member_id",
        "label": "Member ID",
        "type": "text",
        "required": true
      },
      {
        "key": "auth_user_id",
        "label": "Verified EPEW account user UUID",
        "type": "text",
        "required": true
      },
      {
        "key": "identity_evidence",
        "label": "Verified member/account ownership evidence",
        "type": "text",
        "required": true
      }
    ]
  }
};

export function validateNetworkRecord(value: unknown) {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
 const input=value as Record<string,unknown>, kind=String(input.kind||''), schema=networkSchemas[kind];
 if (!schema || typeof input.record_key!=='string' || !/^[A-Za-z0-9_.:-]{1,160}$/.test(input.record_key) || typeof input.reason!=='string' || !input.reason.trim() || input.reason.length>4000 || typeof input.request_id!=='string' || !/^[a-f0-9-]{36}$/i.test(input.request_id) || !Number.isInteger(input.expected_version) || Number(input.expected_version)<0) return null;
 if (!input.data || typeof input.data!=='object' || Array.isArray(input.data)) return null;
 const raw=input.data as Record<string,unknown>,data:Record<string,unknown>={};
 if(Object.keys(raw).some(k=>!schema.fields.some(f=>f.key===k))) return null;
 for(const f of schema.fields) {
  const v=raw[f.key];
  if(f.type==='boolean') {if(typeof v!=='boolean') return null; data[f.key]=v;continue;}
  if(v===undefined || v===null || v==='') {if(f.required)return null;data[f.key]=null;continue;}
  if(f.type==='number'){if(typeof v!=='number'||!Number.isFinite(v))return null;data[f.key]=v;continue;}
  if(typeof v!=='string'||v.length>12000||(!v.trim()&&f.required))return null;
  if(f.options&&!f.options.includes(v))return null;
  if(f.type==='url'&&!/^https:\/\//.test(v))return null;
  data[f.key]=v.trim();
 }
 return {kind,record_key:input.record_key,expected_version:input.expected_version,data,reason:input.reason.trim(),request_id:input.request_id};
}
