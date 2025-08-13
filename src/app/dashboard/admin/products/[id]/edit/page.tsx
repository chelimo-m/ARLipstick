"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input, InputNumber, message, Spin } from "antd";
import Image from "next/image";
import type { RcFile } from "antd/es/upload";
import type { Product } from "@/app/types/models";

export default function EditProductPage() {
	const router = useRouter();
	const params = useParams();
	const id =
		params && typeof params === "object" && "id" in params
			? params.id
			: undefined;
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [name, setName] = useState("");
	const [colorName, setColorName] = useState("");
	const [hexColor, setHexColor] = useState("#E11D48");
	const [price, setPrice] = useState("");
	const [oldPrice, setOldPrice] = useState("");
	const [stock, setStock] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		async function fetchProduct() {
			setLoading(true);
			try {
				const res = await fetch("/api/products");
				if (!res.ok) throw new Error("Failed to fetch products");
				const data: Product[] = await res.json();
				const found = data.find((p: Product) => p.productId === id);
				if (!found) throw new Error("Product not found");
				setName(found.name || "");
				setColorName(found.colorName || "");
				setHexColor(found.hexColor || "#E11D48");
				setPrice(found.price?.toString() || "");
				setOldPrice(found.oldPrice?.toString() || "");
				setStock(found.stock?.toString() || "");
			} catch (err: unknown) {
				setError((err as Error).message || "Error fetching product");
			} finally {
				setLoading(false);
			}
		}
		if (id) fetchProduct();
	}, [id]);

	const handleImageUpload = async (file: RcFile) => {
		setUploading(true);
		setUploadProgress(10);
		const toBase64 = (file: File) =>
			new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = (err) => reject(err);
			});
		try {
			const base64 = await toBase64(file);
			setUploadProgress(30);
			const uploadRes = await fetch("/api/products/upload-image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ image: base64 }),
			});
			setUploadProgress(70);
			if (!uploadRes.ok) {
				const data = await uploadRes.json();
				throw new Error(data.message || "Cloudinary upload failed");
			}
			const { url } = await uploadRes.json();
			setImageUrl(url);
			setUploadProgress(100);
			message.success("Image uploaded!");
		} catch {
			message.error("Image upload failed. Please try again.");
		} finally {
			setUploading(false);
			setUploadProgress(null);
		}
		return false;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSaving(true);
		try {
			const res = await fetch("/api/products", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId: id,
					name,
					colorName,
					hexColor,
					price,
					oldPrice,
					stock,
					imageUrl,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to update product");
			}
			message.success("Product updated successfully!");
			router.push("/dashboard/admin/products");
		} catch (err: unknown) {
			setError(
				(err as Error).message || "Failed to update product. Please try again."
			);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<Spin size="large" />
			</div>
		);
	}
	if (error) {
		return <div className="text-red-500 text-center py-12">{error}</div>;
	}

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 flex items-center justify-center py-8 animate-fade-in">
			<div className="w-full container max-w-2xl mx-auto pt-8 px-4">
				<div className="bg-white/90 rounded-3xl shadow-2xl border border-pink-100 p-8 relative overflow-hidden">
					<h1 className="text-3xl font-extrabold text-pink-700 mb-8 text-center mt-2 tracking-tight">
						Edit Product
					</h1>
					<form
						className="flex flex-col gap-6"
						onSubmit={handleSubmit}
						autoComplete="off"
					>
						<div className="flex flex-col gap-2">
							<label className="font-semibold text-pink-500">
								Product Name
							</label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								size="large"
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label className="font-semibold text-pink-500">Color Name</label>
							<Input
								value={colorName}
								onChange={(e) => setColorName(e.target.value)}
								size="large"
							/>
						</div>
						{/* Hex Color and Code Row */}
						<div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
							<div className="flex flex-col w-full md:w-1/2">
								<label className="font-semibold text-pink-500">Hex Color</label>
								<Input
									type="color"
									value={hexColor}
									onChange={(e) => setHexColor(e.target.value)}
									size="large"
									className="h-12 w-full p-0 border-none bg-transparent cursor-pointer"
									style={{ background: "none" }}
								/>
							</div>
							<div className="flex flex-col w-full md:w-1/2">
								<label className="font-semibold text-pink-500">
									Color Code
								</label>
								<Input
									value={hexColor}
									onChange={(e) => setHexColor(e.target.value)}
									size="large"
								/>
							</div>
						</div>
						{/* Price and Old Price Row */}
						<div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
							<div className="flex flex-col w-full md:w-1/2">
								<label className="font-semibold text-pink-500">Price</label>
								<InputNumber
									value={Number(price)}
									onChange={(v) => setPrice(v?.toString() || "")}
									size="large"
									min={0}
									className="w-full"
									required
								/>
							</div>
							<div className="flex flex-col w-full md:w-1/2">
								<label className="font-semibold text-pink-500">Old Price</label>
								<InputNumber
									value={Number(oldPrice)}
									onChange={(v) => setOldPrice(v?.toString() || "")}
									size="large"
									min={0}
									className="w-full"
								/>
							</div>
						</div>
						{/* Stock and Status Row */}
						<div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
							<div className="flex flex-col w-full md:w-1/2">
								<label className="font-semibold text-pink-500">Stock</label>
								<InputNumber
									value={Number(stock)}
									onChange={(v) => setStock(v?.toString() || "")}
									size="large"
									min={0}
									className="w-full"
									required
								/>
							</div>
						</div>
						{/* Product Image Upload */}
						<div className="flex flex-col gap-2">
							<label className="font-semibold text-pink-500">
								Product Image
							</label>
							<input
								type="file"
								accept="image/*"
								ref={fileInputRef}
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleImageUpload(file as RcFile);
								}}
								className="mb-2"
								disabled={uploading}
							/>
							{uploadProgress !== null && (
								<div className="text-pink-500 text-center font-semibold animate-fade-in mt-2">
									Uploading image: {uploadProgress}%
								</div>
							)}
							{imageUrl && (
								<div className="mt-2 flex justify-center">
									<Image
										src={imageUrl}
										alt="Preview"
										width={80}
										height={80}
										className="rounded-xl border border-pink-200"
									/>
								</div>
							)}
						</div>
						{error && (
							<div className="text-red-500 text-center font-semibold animate-fade-in mt-2">
								{error}
							</div>
						)}
						<button
							type="submit"
							disabled={saving}
							className={`w-full mt-2 px-8 py-4 rounded-full shadow-2xl font-bold text-lg transition-all duration-150 ${
								saving
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: "bg-gradient-to-r from-pink-500 to-pink-400 text-white hover:from-pink-600 hover:to-pink-500 border-2 border-pink-200 hover:border-pink-400"
							}`}
						>
							{saving ? "Saving..." : "Save Changes"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
