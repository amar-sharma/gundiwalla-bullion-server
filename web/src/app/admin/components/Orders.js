'use client';
import { useState, useEffect } from 'react';
import { Table, Button, Space, Popconfirm, Modal, InputNumber, Tag, App, Tooltip, Spin, Empty, Pagination } from 'antd';
import { DeleteOutlined, CheckOutlined, EditOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

// Styles for responsive design
const styles = {
	container: {
		width: '100%',
	},
	// Desktop table wrapper - hidden on mobile
	tableWrapper: {
		display: 'block',
	},
	// Mobile cards wrapper - hidden on desktop
	cardsWrapper: {
		display: 'none',
	},
	// Order card styles
	orderCard: {
		background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
		border: '1px solid #333',
		borderRadius: '12px',
		padding: '16px',
		marginBottom: '12px',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
	},
	cardHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: '12px',
		flexWrap: 'wrap',
		gap: '8px',
	},
	cardItemInfo: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		flexWrap: 'wrap',
	},
	cardItemName: {
		color: '#fff',
		fontWeight: '600',
		fontSize: '16px',
	},
	cardQuantity: {
		color: '#d4af37',
		fontWeight: 'bold',
		fontSize: '18px',
	},
	cardRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '8px',
		flexWrap: 'wrap',
		gap: '8px',
	},
	cardCustomer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
	},
	cardCustomerName: {
		color: '#fff',
		fontWeight: '500',
		fontSize: '14px',
	},
	cardCustomerPhone: {
		color: '#888',
		fontSize: '13px',
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
	},
	cardDate: {
		color: '#888',
		fontSize: '12px',
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
	},
	cardPricing: {
		background: 'rgba(212, 175, 55, 0.1)',
		borderRadius: '8px',
		padding: '12px',
		marginTop: '12px',
		marginBottom: '12px',
	},
	cardPricingRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '4px',
	},
	cardPricingLabel: {
		color: '#888',
		fontSize: '13px',
	},
	cardPricingValue: {
		color: '#fff',
		fontSize: '13px',
	},
	cardTotal: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderTop: '1px solid rgba(212, 175, 55, 0.3)',
		paddingTop: '8px',
		marginTop: '8px',
	},
	cardTotalLabel: {
		color: '#d4af37',
		fontWeight: '600',
		fontSize: '14px',
	},
	cardTotalValue: {
		color: '#d4af37',
		fontWeight: 'bold',
		fontSize: '18px',
	},
	cardActions: {
		display: 'flex',
		gap: '8px',
		marginTop: '12px',
		paddingTop: '12px',
		borderTop: '1px solid #333',
		flexWrap: 'wrap',
	},
	actionButton: {
		flex: 1,
		minWidth: '80px',
	},
	orderId: {
		color: '#666',
		fontSize: '11px',
		marginTop: '8px',
		fontFamily: 'monospace',
	},
	loadingContainer: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		padding: '40px',
	},
	paginationWrapper: {
		display: 'flex',
		justifyContent: 'center',
		marginTop: '16px',
	},
};

// CSS for responsive breakpoints
const responsiveCSS = `
	@media (max-width: 768px) {
		.orders-table-wrapper {
			display: none !important;
		}
		.orders-cards-wrapper {
			display: block !important;
		}
	}
	@media (min-width: 769px) {
		.orders-table-wrapper {
			display: block !important;
		}
		.orders-cards-wrapper {
			display: none !important;
		}
	}
`;

const Orders = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState(null);
	const [newQuantity, setNewQuantity] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;
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

	// Get paginated orders for mobile view
	const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

	// Render a single order card for mobile
	const renderOrderCard = (order) => {
		const statusColor = order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'default';
		const typeColor = order.itemDetails.type === 'buy' ? 'green' : 'red';

		// Determine if the item is silver or gold based on item name
		const itemName = order.itemDetails.item?.toLowerCase() || '';
		const isSilver = itemName.includes('silver');

		// Theme colors - Gold: #d4af37, Silver: #c0c0c0
		const accentColor = isSilver ? '#c0c0c0' : '#d4af37';
		const accentColorRgba = isSilver ? 'rgba(192, 192, 192, 0.1)' : 'rgba(212, 175, 55, 0.1)';
		const accentBorderColor = isSilver ? 'rgba(192, 192, 192, 0.3)' : 'rgba(212, 175, 55, 0.3)';
		const cardBorderColor = isSilver ? '#4a4a4a' : '#333';

		return (
			<div key={order.id} style={{
				...styles.orderCard,
				border: `1px solid ${cardBorderColor}`,
				boxShadow: isSilver
					? '0 4px 12px rgba(192, 192, 192, 0.15)'
					: '0 4px 12px rgba(0, 0, 0, 0.3)',
			}}>
				{/* Header: Item type, name, and status */}
				<div style={styles.cardHeader}>
					<div style={styles.cardItemInfo}>
						<Tag color={typeColor} style={{ margin: 0, fontWeight: 'bold' }}>
							{order.itemDetails.type.toUpperCase()}
						</Tag>
						<span style={{ ...styles.cardItemName, color: accentColor }}>
							{order.itemDetails.item}
						</span>
					</div>
					<Tag color={statusColor} style={{ margin: 0 }}>
						{order.status}
					</Tag>
				</div>

				{/* Customer info and date */}
				<div style={styles.cardRow}>
					<div style={styles.cardCustomer}>
						<span style={styles.cardCustomerName}>{order.userName}</span>
						<span style={styles.cardCustomerPhone}>
							<PhoneOutlined />
							{order.userPhone}
						</span>
					</div>
					<div style={styles.cardDate}>
						<CalendarOutlined />
						{order.timestamp?.toDate().toLocaleString() || 'N/A'}
					</div>
				</div>

				{/* Pricing breakdown */}
				<div style={{
					...styles.cardPricing,
					background: accentColorRgba,
				}}>
					<div style={styles.cardPricingRow}>
						<span style={styles.cardPricingLabel}>Quantity</span>
						<span style={{ ...styles.cardQuantity, color: accentColor }}>
							{order.itemDetails.quantity}g
						</span>
					</div>
					<div style={styles.cardPricingRow}>
						<span style={styles.cardPricingLabel}>Rate</span>
						<span style={styles.cardPricingValue}>₹{order.itemDetails.rate?.toLocaleString()}</span>
					</div>
					<div style={{
						...styles.cardTotal,
						borderTop: `1px solid ${accentBorderColor}`,
					}}>
						<span style={{ ...styles.cardTotalLabel, color: accentColor }}>
							Total Amount
						</span>
						<span style={{ ...styles.cardTotalValue, color: accentColor }}>
							₹{order.totalAmount?.toLocaleString()}
						</span>
					</div>
				</div>

				{/* Action buttons */}
				<div style={styles.cardActions}>
					{order.status === 'PENDING' && (
						<Button
							type="primary"
							icon={<CheckOutlined />}
							onClick={() => handleComplete(order)}
							style={styles.actionButton}
						>
							Complete
						</Button>
					)}
					<Button
						icon={<EditOutlined />}
						onClick={() => openEditModal(order)}
						style={styles.actionButton}
					>
						Edit
					</Button>
					<Popconfirm
						title="Delete the order"
						description="Are you sure to delete this order?"
						onConfirm={() => handleDelete(order.id)}
						okText="Yes"
						cancelText="No"
					>
						<Button
							danger
							icon={<DeleteOutlined />}
							style={styles.actionButton}
						>
							Delete
						</Button>
					</Popconfirm>
				</div>

				{/* Order ID */}
				<div style={styles.orderId}>
					ID: {order.orderId}
				</div>
			</div>
		);
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
			render: (rate) => `₹${rate?.toLocaleString()}`,
		},
		{
			title: 'Total',
			dataIndex: 'totalAmount',
			key: 'totalAmount',
			render: (amount) => <span style={{ fontWeight: 'bold' }}>₹{amount?.toLocaleString()}</span>,
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
		<div style={styles.container}>
			{/* Inject responsive CSS */}
			<style>{responsiveCSS}</style>

			{/* Desktop Table View */}
			<div className="orders-table-wrapper" style={styles.tableWrapper}>
				<Table
					columns={columns}
					dataSource={orders}
					rowKey="id"
					loading={loading}
					pagination={{ pageSize: 10 }}
					scroll={{ x: 1000 }}
				/>
			</div>

			{/* Mobile Cards View */}
			<div className="orders-cards-wrapper" style={styles.cardsWrapper}>
				{loading ? (
					<div style={styles.loadingContainer}>
						<Spin size="large" />
					</div>
				) : orders.length === 0 ? (
					<Empty description="No orders found" />
				) : (
					<>
						{paginatedOrders.map(renderOrderCard)}
						{orders.length > pageSize && (
							<div style={styles.paginationWrapper}>
								<Pagination
									current={currentPage}
									total={orders.length}
									pageSize={pageSize}
									onChange={setCurrentPage}
									showSizeChanger={false}
									size="small"
								/>
							</div>
						)}
					</>
				)}
			</div>

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
		</div>
	);
};

export default Orders;
