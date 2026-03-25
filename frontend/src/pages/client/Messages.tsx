import { useSearchParams, useLocation } from 'react-router-dom';
import RealTimeMessaging from '../../components/messaging/RealTimeMessaging';

const Messages = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Get designer ID and product ID from URL params or navigation state
  const designerId = searchParams.get('designer') || location.state?.selectedDesignerId;
  const productId = searchParams.get('product');

  console.log('💬 Messages page loaded with:', {
    designerId,
    productId,
    navigationState: location.state
  });

  return (
    <div className="h-full">
      <RealTimeMessaging
        designerId={designerId || undefined}
        productId={productId || undefined}
      />
    </div>
  );
};

export default Messages;
