'use client';
import { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, Modal, InputNumber, Tag, App, Tooltip } from 'antd';
import { DeleteOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const Orders = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState(null);
	const [newQuantity, setNewQuantity] = useState(0);
	const { message } = App.useApp();

	useEffect(() => {
		const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
		const unsubscribe = onSnapshot(q, (snapshot) => {
			const ordersData = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			}));
			setOrders(ordersData);
			setLoading(false);
		}, (error) => {
			console.error("Error fetching orders: ", error);
			message.error("Failed to fetch orders");
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const handleComplete = async (record) => {
		try {
			await updateDoc(doc(db, 'orders', record.id), {
				status: 'COMPLETED'
			});
			message.success('Order completed successfully');
		} catch (error) {
			console.error("Error completing order: ", error);
			message.error('Failed to complete order');
		}
	};

	const handleDelete = async (id) => {
		try {
			await deleteDoc(doc(db, 'orders', id));
			message.success('Order deleted successfully');
		} catch (error) {
			console.error("Error deleting order: ", error);
			message.error('Failed to delete order');
		}
	};

	const openEditModal = (record) => {
		setEditingOrder(record);
		setNewQuantity(record.itemDetails.quantity);
		setIsModalOpen(true);
	};

	const handleEditOk = async () => {
		if (!editingOrder) return;

		try {
			const rate = editingOrder.itemDetails.rate;
			const oldQuantity = editingOrder.itemDetails.quantity;
			const newTotalAmount = Math.round(newQuantity * rate / oldQuantity);

			await updateDoc(doc(db, 'orders', editingOrder.id), {
				'itemDetails.quantity': newQuantity,
				totalAmount: newTotalAmount
			});

			message.success('Order quantity updated');
			setIsModalOpen(false);
			setEditingOrder(null);
		} catch (error) {
			console.error("Error updating order: ", error);
			message.error('Failed to update order');
		}
	};

	const handleEditCancel = () => {
		setIsModalOpen(false);
		setEditingOrder(null);
	};

	const columns = [
		{
			title: 'Order ID',
			dataIndex: 'orderId',
			key: 'orderId',
			render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
		},
		{
			title: 'Date',
			dataIndex: 'timestamp',
			key: 'timestamp',
			render: (timestamp) => timestamp?.toDate().toLocaleString() || 'N/A',
		},
		{
			title: 'Customer',
			key: 'customer',
			render: (_, record) => (
				<div>
					<div>{record.userName}</div>
					<div style={{ fontSize: '0.8em', color: '#888' }}>{record.userPhone}</div>
				</div>
			),
		},
		{
			title: 'Item',
			key: 'item',
			render: (_, record) => (
				<div>
					<Tag color={record.itemDetails.type === 'buy' ? 'green' : 'red'}>
						{record.itemDetails.type.toUpperCase()}
					</Tag>
					{record.itemDetails.item}
				</div>
			),
		},
		{
			title: 'Qty',
			dataIndex: ['itemDetails', 'quantity'],
			key: 'quantity',
		},
		{
			title: 'Rate',
			dataIndex: ['itemDetails', 'rate'],
			key: 'rate',
			render: (rate) => `₹${rate.toLocaleString()}`,
		},
		{
			title: 'Total',
			dataIndex: 'totalAmount',
			key: 'totalAmount',
			render: (amount) => <span style={{ fontWeight: 'bold' }}>₹{amount.toLocaleString()}</span>,
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			render: (status) => {
				let color = 'default';
				if (status === 'COMPLETED') color = 'success';
				if (status === 'PENDING') color = 'warning';
				return <Tag color={color}>{status}</Tag>;
			},
		},
		{
			title: 'Actions',
			key: 'actions',
			render: (_, record) => (
				<Space size="middle">
					{record.status === 'PENDING' && (
						<Tooltip title="Mark as Completed">
							<Button
								type="primary"
								shape="circle"
								icon={<CheckOutlined />}
								onClick={() => handleComplete(record)}
							/>
						</Tooltip>
					)}
					<Tooltip title="Edit Quantity">
						<Button
							shape="circle"
							icon={<EditOutlined />}
							onClick={() => openEditModal(record)}
						/>
					</Tooltip>
					<Popconfirm
						title="Delete the order"
						description="Are you sure to delete this order?"
						onConfirm={() => handleDelete(record.id)}
						okText="Yes"
						cancelText="No"
					>
						<Tooltip title="Delete Order">
							<Button danger shape="circle" icon={<DeleteOutlined />} />
						</Tooltip>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<>
			<Table
				columns={columns}
				dataSource={orders}
				rowKey="id"
				loading={loading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 1000 }}
			/>

			<Modal
				title="Edit Order Quantity"
				open={isModalOpen}
				onOk={handleEditOk}
				onCancel={handleEditCancel}
			>
				<p>Adjust the quantity for this order. The total amount will be recalculated based on the locked rate of <strong>₹{editingOrder?.itemDetails?.rate}</strong>.</p>
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
					<span>Quantity:</span>
					<InputNumber
						min={1}
						value={newQuantity}
						onChange={setNewQuantity}
						style={{ width: '100%' }}
					/>
				</div>
				{editingOrder && (
					<div style={{ marginTop: '20px', textAlign: 'right' }}>
						New Total: <strong>₹{Math.round(newQuantity * editingOrder.itemDetails.rate).toLocaleString()}</strong>
					</div>
				)}
			</Modal>
		</>
	);
};

export default Orders;
