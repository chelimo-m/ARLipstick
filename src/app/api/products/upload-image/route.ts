import { NextRequest, NextResponse } from "next/server";
import cloudinary from "cloudinary";

cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();
		const { image } = data; // image should be a base64 string or data URL
		if (!image) {
			return NextResponse.json(
				{ message: "No image provided" },
				{ status: 400 }
			);
		}
		const uploadRes = await cloudinary.v2.uploader.upload(image, {
			folder: "lipsticks",
			resource_type: "image",
		});
		return NextResponse.json({ url: uploadRes.secure_url });
	} catch (error) {
		return NextResponse.json(
			{ message: "Cloudinary upload failed", error: (error as Error).message },
			{ status: 500 }
		);
	}
}
