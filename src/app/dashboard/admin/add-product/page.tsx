"use client";
import { useState, useRef, useEffect } from "react";
import { FaSpinner, FaTimes, FaTint, FaUpload, FaCheck } from "react-icons/fa";
import {
	Input,
	message,
	Select,
	Form,
	Button,
	Card,
	Progress,
	Tag,
	Divider,
} from "antd";
import type { Product as BaseProduct } from "@/app/types/models";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Product = BaseProduct & { hexColor?: string; colorName?: string };

const { TextArea } = Input;
const { Option } = Select;

const LIPSTICK_COLORS = [
	{ name: "Classic Red", hex: "#DC2626" },
	{ name: "Rose Pink", hex: "#E11D48" },
	{ name: "Coral", hex: "#F97316" },
	{ name: "Nude", hex: "#F59E0B" },
	{ name: "Berry", hex: "#7C3AED" },
	{ name: "Plum", hex: "#9D174D" },
	{ name: "Mauve", hex: "#A855F7" },
	{ name: "Brown", hex: "#92400E" },
	{ name: "Orange", hex: "#EA580C" },
	{ name: "Pink", hex: "#EC4899" },
];

const FINISH_OPTIONS = [
	{ value: "matte", label: "Matte" },
	{ value: "gloss", label: "Gloss" },
	{ value: "satin", label: "Satin" },
	{ value: "metallic", label: "Metallic" },
	{ value: "cream", label: "Cream" },
	{ value: "sheer", label: "Sheer" },
];

const CATEGORY_OPTIONS = ["Lipstick"];

export default function AddProductPage() {
	const [form] = Form.useForm();
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [loading, setLoading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState("");
	const [products, setProducts] = useState<Product[]>([]);
	const [selectedColor, setSelectedColor] = useState(LIPSTICK_COLORS[1]);
	const [formValues, setFormValues] = useState({
		name: "",
		colorName: "",
		description: "",
		price: "",
		oldPrice: "",
		stock: "",
		category: "Lipstick",
		finish: "matte",
	});

	useEffect(() => {
		fetch("/api/products")
			.then((res) => res.json())
			.then(setProducts)
			.catch(() => setProducts([]));
	}, []);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				message.error("Image size should be less than 5MB");
				return;
			}
			setImageFile(file);
			setImageUrl(URL.createObjectURL(file));
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			if (file.size > 5 * 1024 * 1024) {
				message.error("Image size should be less than 5MB");
				return;
			}
			setImageFile(file);
			setImageUrl(URL.createObjectURL(file));
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const handleRemoveImage = () => {
		setImageFile(null);
		setImageUrl("");
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const uploadImage = async (file: File): Promise<string> => {
		const toBase64 = (file: File) =>
			new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = (err) => reject(err);
			});

		setUploadProgress(10);
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
			throw new Error(data.message || "Image upload failed");
		}

		const { url } = await uploadRes.json();
		setUploadProgress(100);
		return url;
	};

	const onFinish = async (values: any) => {
		if (!imageFile && !imageUrl) {
			message.error("Please upload a product image");
			return;
		}

		setLoading(true);
		setUploadProgress(null);

		try {
			let finalImageUrl = imageUrl;

			if (imageFile) {
				finalImageUrl = await uploadImage(imageFile);
			}

			const productData = {
				name: values.name,
				description: values.description,
				colorName: values.colorName,
				hexColor: selectedColor.hex,
				price: values.price,
				oldPrice: values.oldPrice || undefined,
				imageUrl: finalImageUrl,
				stock: values.stock,
				category: values.category,
				finish: values.finish,
			};

			const res = await fetch("/api/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(productData),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.message || "Failed to add product");
			}

			const newProduct = await res.json();
			setProducts((prev) => [newProduct, ...prev]);

			message.success("Product added successfully!");
			form.resetFields();
			handleRemoveImage();
			setSelectedColor(LIPSTICK_COLORS[1]);
		} catch (error) {
			message.error(
				error instanceof Error ? error.message : "Failed to add product"
			);
		} finally {
			setLoading(false);
			setUploadProgress(null);
		}
	};

	const handleColorSelect = (color: (typeof LIPSTICK_COLORS)[0]) => {
		setSelectedColor(color);
		form.setFieldsValue({ colorName: color.name });
		setFormValues((prev) => ({ ...prev, colorName: color.name }));
	};

	const handleFormChange = (changedValues: any, allValues: any) => {
		setFormValues(allValues);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4">
			<div className="max-w-7xl mx-auto">
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-800 mb-2">
								Add New Product
							</h1>
							<p className="text-gray-600">
								Create a new lipstick product for your collection
							</p>
						</div>
						<Button
							type="primary"
							onClick={() => router.push("/dashboard/admin/products")}
							className="bg-pink-500 hover:bg-pink-600 border-pink-500"
						>
							View All Products
						</Button>
					</div>

					{products.length > 0 && (
						<Card className="mb-6">
							<h3 className="text-lg font-semibold text-gray-700 mb-4">
								Existing Products
							</h3>
							<div className="flex gap-3 overflow-x-auto pb-2">
								{products.slice(0, 10).map((product) => (
									<div
										key={product.productId}
										className="flex-shrink-0 text-center"
									>
										<div
											className="w-16 h-16 rounded-full border-2 border-white shadow-md mb-2 overflow-hidden"
											style={{ backgroundColor: product.hexColor || "#F9E2E7" }}
										>
											<Image
												src={product.imageUrl}
												alt={product.name}
												width={64}
												height={64}
												className="w-full h-full object-cover"
											/>
										</div>
										<p className="text-xs text-gray-600 font-medium truncate w-16">
											{product.name}
										</p>
										<p className="text-xs text-gray-400">
											Ksh {product.price?.toLocaleString()}
										</p>
									</div>
								))}
							</div>
						</Card>
					)}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2">
						<Card className="shadow-lg border-0">
							<Form
								form={form}
								layout="vertical"
								onFinish={onFinish}
								onValuesChange={handleFormChange}
								initialValues={{
									category: "Lipstick",
									finish: "matte",
									stock: 0,
								}}
							>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<Form.Item
										name="name"
										label="Product Name"
										rules={[
											{ required: true, message: "Please enter product name" },
										]}
									>
										<Input
											placeholder="e.g., Velvet Matte Lipstick"
											size="large"
											className="rounded-lg"
										/>
									</Form.Item>

									<Form.Item
										name="colorName"
										label="Color Name"
										rules={[
											{ required: true, message: "Please enter color name" },
										]}
									>
										<Input
											placeholder="e.g., Limuru Pink"
											size="large"
											className="rounded-lg"
										/>
									</Form.Item>

									<Form.Item
										name="description"
										label="Description"
										rules={[
											{
												required: true,
												message: "Please enter product description",
											},
										]}
										className="md:col-span-2"
									>
										<TextArea
											placeholder="Describe the product features, benefits, and characteristics..."
											rows={4}
											className="rounded-lg"
										/>
									</Form.Item>

									{/* Price and Old Price Row */}
									<div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
										<Form.Item
											name="price"
											label="Price (KSH)"
											rules={[
												{ required: true, message: "Please enter price" },
												{
													validator: (_, value) => {
														if (value && Number(value) > 0) {
															return Promise.resolve();
														}
														return Promise.reject(
															new Error("Price must be greater than 0")
														);
													},
												},
											]}
										>
											<Input
												type="number"
												placeholder="1200"
												size="large"
												prefix="Ksh"
												className="rounded-lg"
												min="1"
												step="0.01"
											/>
										</Form.Item>

										<Form.Item
											name="oldPrice"
											label="Old Price (KSH) - Optional"
										>
											<Input
												type="number"
												placeholder="1500"
												size="large"
												prefix="Ksh"
												className="rounded-lg"
												min="0"
												step="0.01"
											/>
										</Form.Item>
									</div>

									{/* Stock, Category, and Finish Row */}
									<div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
										<Form.Item
											name="stock"
											label="Stock Quantity"
											rules={[
												{
													required: true,
													message: "Please enter stock quantity",
												},
												{
													validator: (_, value) => {
														if (value && Number(value) >= 0) {
															return Promise.resolve();
														}
														return Promise.reject(
															new Error("Stock must be 0 or greater")
														);
													},
												},
											]}
										>
											<Input
												type="number"
												placeholder="100"
												size="large"
												className="rounded-lg"
												min="0"
												step="1"
											/>
										</Form.Item>

										<Form.Item name="category" label="Category">
											<Input
												value="Lipstick"
												disabled
												size="large"
												className="rounded-lg bg-gray-50"
											/>
										</Form.Item>

										<Form.Item
											name="finish"
											label="Finish Type"
											rules={[
												{ required: true, message: "Please select finish" },
											]}
										>
											<Select size="large" className="rounded-lg">
												{FINISH_OPTIONS.map((finish) => (
													<Option key={finish.value} value={finish.value}>
														{finish.label}
													</Option>
												))}
											</Select>
										</Form.Item>
									</div>
								</div>

								<Divider>Color Selection</Divider>
								<div className="mb-6">
									<p className="text-sm text-gray-600 mb-4">
										Choose a color for your lipstick or enter a custom hex code
									</p>
									<div className="grid grid-cols-5 gap-3 mb-4">
										{LIPSTICK_COLORS.map((color) => (
											<button
												key={color.hex}
												type="button"
												onClick={() => handleColorSelect(color)}
												className={`p-3 rounded-lg border-2 transition-all ${
													selectedColor.hex === color.hex
														? "border-pink-500 shadow-lg scale-105"
														: "border-gray-200 hover:border-pink-300"
												}`}
												style={{ backgroundColor: color.hex }}
											>
												<div className="w-full h-8 rounded-md bg-white/20 flex items-center justify-center">
													{selectedColor.hex === color.hex && (
														<FaCheck className="text-white text-sm" />
													)}
												</div>
												<p className="text-xs text-white font-medium mt-1 text-center drop-shadow">
													{color.name}
												</p>
											</button>
										))}
									</div>

									<div className="flex items-center gap-3">
										<Input
											type="color"
											value={selectedColor.hex}
											onChange={(e) =>
												setSelectedColor({
													name: "Custom",
													hex: e.target.value,
												})
											}
											className="w-12 h-12 p-0 border-2 border-gray-200 rounded-lg cursor-pointer"
										/>
										<Input
											value={selectedColor.hex}
											onChange={(e) =>
												setSelectedColor({
													name: "Custom",
													hex: e.target.value,
												})
											}
											placeholder="#E11D48"
											className="rounded-lg"
										/>
										<Tag color="pink" className="px-3 py-1">
											{selectedColor.name}
										</Tag>
									</div>
								</div>

								<Divider>Product Image</Divider>
								<div className="mb-6">
									<div
										className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
											imageUrl
												? "border-green-300 bg-green-50"
												: "border-gray-300 hover:border-pink-400 bg-gray-50"
										}`}
										onClick={() => fileInputRef.current?.click()}
										onDrop={handleDrop}
										onDragOver={handleDragOver}
									>
										{imageUrl ? (
											<div className="relative inline-block">
												<Image
													src={imageUrl}
													alt="Preview"
													width={200}
													height={200}
													className="rounded-lg shadow-md"
												/>
												<Button
													type="text"
													icon={<FaTimes />}
													onClick={(e) => {
														e.stopPropagation();
														handleRemoveImage();
													}}
													className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-md"
												/>
											</div>
										) : (
											<div>
												<FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
												<p className="text-lg font-medium text-gray-600 mb-2">
													Upload Product Image
												</p>
												<p className="text-sm text-gray-500">
													Drag and drop an image here, or click to select
												</p>
												<p className="text-xs text-gray-400 mt-2">
													Supports: JPG, PNG, GIF (Max 5MB)
												</p>
											</div>
										)}
									</div>

									{uploadProgress !== null && (
										<div className="mt-4">
											<Progress
												percent={uploadProgress}
												status="active"
												strokeColor="#ec4899"
											/>
											<p className="text-sm text-gray-600 text-center mt-2">
												Uploading image... {uploadProgress}%
											</p>
										</div>
									)}

									<input
										type="file"
										accept="image/*"
										ref={fileInputRef}
										className="hidden"
										onChange={handleImageChange}
									/>
								</div>
							</Form>
						</Card>
					</div>

					<div className="lg:col-span-1">
						<Card className="shadow-lg border-0 sticky top-4">
							<div className="text-center mb-6">
								<h3 className="text-xl font-bold text-gray-800 mb-2">
									Live Preview
								</h3>
								<p className="text-sm text-gray-600">
									See how your product will appear
								</p>
							</div>

							<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
								<div className="relative mb-4">
									<div
										className="w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center"
										style={{ backgroundColor: selectedColor.hex + "20" }}
									>
										{imageUrl ? (
											<Image
												src={imageUrl}
												alt="Product Preview"
												width={200}
												height={200}
												className="object-contain w-full h-full"
											/>
										) : (
											<div className="text-center">
												<FaTint className="text-6xl text-gray-300 mx-auto mb-2" />
												<p className="text-gray-400 text-sm">
													No image uploaded
												</p>
											</div>
										)}
									</div>

									<div
										className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-white shadow-md"
										style={{ backgroundColor: selectedColor.hex }}
									/>
								</div>

								<div className="space-y-3">
									<h4 className="font-bold text-lg text-gray-800">
										{formValues.name || "Product Name"}
									</h4>

									<div className="flex items-center gap-2">
										<Tag color="pink" className="text-xs">
											{formValues.category || "Lipstick"}
										</Tag>
										<Tag color="purple" className="text-xs capitalize">
											{formValues.finish || "matte"}
										</Tag>
									</div>

									<p className="text-sm text-gray-600">
										{formValues.colorName || "Color Name"}
									</p>

									<p className="text-xs text-gray-500">
										{formValues.description ||
											"Product description will appear here..."}
									</p>

									<div className="flex items-center justify-between pt-2">
										<div>
											{formValues.oldPrice && (
												<p className="text-sm text-gray-400 line-through">
													Ksh {Number(formValues.oldPrice).toLocaleString()}
												</p>
											)}
											<p className="text-xl font-bold text-pink-600">
												Ksh {Number(formValues.price || 0).toLocaleString()}
											</p>
										</div>

										<div className="text-right">
											<p className="text-sm text-gray-500">Stock</p>
											<p className="font-semibold text-gray-700">
												{formValues.stock || 0}
											</p>
										</div>
									</div>
								</div>

								{/* Submit Button in Live Preview */}
								<div className="mt-6">
									<Button
										type="primary"
										htmlType="submit"
										loading={loading}
										size="large"
										className="w-full bg-pink-500 hover:bg-pink-600 border-pink-500 h-12 text-lg font-medium rounded-lg shadow-lg"
										onClick={() => form.submit()}
									>
										{loading ? "Adding Product..." : "Add Product"}
									</Button>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
