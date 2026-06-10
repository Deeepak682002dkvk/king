export interface Package {
  id: string; // Mongo ID or fallback string ID
  name: string;
  diamonds: number;
  bonus: number;
  price: number;
  image: string; // Dynamic graphic or preset thumbnail ID
}

export interface Order {
  id: string;
  uid: string;
  nickname: string;
  packageId: string;
  packageName: string;
  diamonds: number;
  bonus: number;
  price: number;
  quantity: number;
  totalAmount: number;
  paymentMethod: 'UPI' | 'GPay' | 'PhonePe' | 'Paytm';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface PlayerVerification {
  uid: string;
  nickname: string;
  exists: boolean;
}
