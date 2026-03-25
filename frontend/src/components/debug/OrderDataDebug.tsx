import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';

const OrderDataDebug: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getDesignerOrders({ page: 1, limit: 5 });
        setOrders(response.docs || []);
        console.log('🔍 DEBUG: Full order response:', response);
        console.log('🔍 DEBUG: First order:', response.docs?.[0]);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div>Loading debug data...</div>;

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Order Data Structure Debug</h2>
      
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div className="space-y-4">
          {orders.slice(0, 2).map((order, index) => (
            <div key={index} className="bg-white p-4 rounded border">
              <h3 className="font-semibold mb-2">Order #{index + 1}</h3>
              <div className="text-sm">
                <p><strong>Order ID:</strong> {order._id}</p>
                <p><strong>Has buyer field:</strong> {order.buyer ? 'Yes' : 'No'}</p>
                <p><strong>Has user field:</strong> {order.user ? 'Yes' : 'No'}</p>
                <p><strong>Has customer field:</strong> {order.customer ? 'Yes' : 'No'}</p>
                
                {order.buyer && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p><strong>Buyer Name:</strong> {order.buyer.name}</p>
                    <p><strong>Buyer Email:</strong> {order.buyer.email}</p>
                  </div>
                )}
                
                {order.user && (
                  <div className="mt-2 p-2 bg-green-50 rounded">
                    <p><strong>User Name:</strong> {order.user.name}</p>
                    <p><strong>User Email:</strong> {order.user.email}</p>
                  </div>
                )}
                
                {order.customer && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded">
                    <p><strong>Customer Name:</strong> {order.customer.name}</p>
                    <p><strong>Customer Email:</strong> {order.customer.email}</p>
                  </div>
                )}

                {order.designer && (
                  <div className="mt-2 p-2 bg-purple-50 rounded">
                    <p><strong>Designer Name:</strong> {order.designer.name}</p>
                    <p><strong>Designer Business:</strong> {order.designer.businessName}</p>
                    <p><strong>Designer Email:</strong> {order.designer.email}</p>
                  </div>
                )}
                
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Full Order Object</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(order, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderDataDebug;
