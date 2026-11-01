/**
 * Servicio de pedidos de tienda (público, sin autenticación) contra `../open-chepicare-web`.
 * Endpoints JSON: POST /public/product_orders y /public/product_orders/:id/upload_proof.
 */
import { api } from './api';
import { uploadForm } from './uploads';

/** Métodos de pago aceptados por el backend (ProductOrder). */
export type OrderPaymentMethod = 'in_store' | 'transfer' | 'mobile_payment';

export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface CreateOrderInput {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  payment_method: OrderPaymentMethod;
  transaction_id?: string;
  notes?: string;
  items: OrderItemInput[];
}

export interface CreatedOrder {
  id: number;
  status: string;
  total: string;
  payment_method: OrderPaymentMethod;
  message: string;
}

/** Crea un pedido de tienda. No requiere sesión. */
export async function createProductOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  return api.post<CreatedOrder>(
    '/public/product_orders',
    {
      product_order: {
        contact_name: input.contact_name,
        contact_email: input.contact_email,
        contact_phone: input.contact_phone,
        payment_method: input.payment_method,
        transaction_id: input.transaction_id,
        notes: input.notes,
        items: input.items,
      },
    },
    { auth: false },
  );
}

/** Solo los pagos por transferencia o pago móvil requieren comprobante. */
export function requiresPaymentProof(method: OrderPaymentMethod): boolean {
  return method === 'transfer' || method === 'mobile_payment';
}

export interface ProofFile {
  uri: string;
  name: string;
  type: string;
}

export interface UploadProofResult {
  success: boolean;
  message: string;
}

/** Sube el comprobante de pago (multipart) de un pedido pendiente. */
export async function uploadOrderProof(
  orderId: number,
  file: ProofFile,
): Promise<UploadProofResult> {
  const body = uploadForm('payment_proof', file);
  return api.post<UploadProofResult>(
    `/public/product_orders/${orderId}/upload_proof`,
    body,
    { auth: false },
  );
}
