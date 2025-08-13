"use client";
import { Table, Button } from "antd";
import "antd/dist/reset.css";

const columns = [
	{ title: "Order #", dataIndex: "orderId", key: "orderId" },
	{ title: "Customer", dataIndex: "customer", key: "customer" },
	{
		title: "Total",
		dataIndex: "total",
		key: "total",
		render: (v: number) => `$${v.toFixed(2)}`,
	},
	{ title: "Status", dataIndex: "status", key: "status" },
	{
		title: "Actions",
		key: "actions",
		render: () => <Button type="primary">Approve</Button>,
	},
];

const data: unknown[] = [];

export default function ApproveOrdersPage() {
	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100">
			<div className="w-full max-w-7xl mx-auto pt-12 px-4">
				<h1 className="text-3xl font-extrabold text-pink-700 mb-8">
					Approve Orders
				</h1>
				<div className="w-full bg-white/90 rounded-3xl shadow-2xl border border-pink-100 p-6">
					<div className="w-full overflow-x-auto">
						<Table
							columns={columns}
							dataSource={data}
							pagination={false}
							rowKey="orderId"
							className="rounded-xl overflow-hidden min-w-[600px]"
							scroll={{ x: true }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
