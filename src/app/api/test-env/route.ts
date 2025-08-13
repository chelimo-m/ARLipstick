import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = process.env.FIREBASE_PRIVATE_KEY;

	return NextResponse.json({
		projectId: projectId || "NOT_SET",
		clientEmail: clientEmail || "NOT_SET",
		privateKeyLength: privateKey ? privateKey.length : 0,
		privateKeyStart: privateKey ? privateKey.substring(0, 50) : "NOT_SET",
		privateKeyEnd: privateKey
			? privateKey.substring(privateKey.length - 50)
			: "NOT_SET",
		hasNewlines: privateKey ? privateKey.includes("\\n") : false,
		hasPEMStart: privateKey
			? privateKey.includes("-----BEGIN PRIVATE KEY-----")
			: false,
	});
}
