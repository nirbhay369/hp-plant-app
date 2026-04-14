import { supabase } from "@/lib/supabase";

// 👉 INSERT (ADD PHE)
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { error } = await supabase
      .from("phe")
      .insert([data]);

    if (error) {
      console.error("Supabase Error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Server Error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}