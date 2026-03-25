import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Orders: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to order reports
    navigate('/designer/order-reports', { replace: true });
  }, [navigate]);

  return null;
};

export default Orders;
