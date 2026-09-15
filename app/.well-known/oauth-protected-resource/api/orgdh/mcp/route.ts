import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    resource: "https://www.epew.us/api/orgdh/mcp",
    authorization_servers: ["https://pblwtbwrmcvyiaqqzkhc.supabase.co/auth/v1"],
    scopes_supported: ["openid", "email", "profile", "offline_access"],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://www.epew.us/orgdh/communication-center",
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
