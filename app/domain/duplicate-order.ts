import { normalizePhone } from "@/app/lib/validation";
import {
  DUPLICATE_ORDER_CODE,
  type DuplicateOrderResponse,
} from "@/types";

export interface CustomerIdentity {
  customerName: string;
  phone: string;
}

/** 與訂單寫入／查詢相同的顧客識別正規化。 */
export function normalizeCustomerIdentity(
  identity: CustomerIdentity,
): CustomerIdentity {
  return {
    customerName: identity.customerName,
    phone: normalizePhone(identity.phone),
  };
}

/** 姓名與電話都相同才是同一個疑似重複身分。 */
export function hasSameCustomerIdentity(
  left: CustomerIdentity,
  right: CustomerIdentity,
): boolean {
  const normalizedLeft = normalizeCustomerIdentity(left);
  const normalizedRight = normalizeCustomerIdentity(right);
  return (
    normalizedLeft.customerName === normalizedRight.customerName &&
    normalizedLeft.phone === normalizedRight.phone
  );
}

/** 前端只以 HTTP status + 穩定 code 辨識重複提醒，不依賴文案。 */
export function isDuplicateOrderResponse(
  status: number,
  data: unknown,
): data is DuplicateOrderResponse {
  return (
    status === 409 &&
    typeof data === "object" &&
    data !== null &&
    (data as { code?: unknown }).code === DUPLICATE_ORDER_CODE &&
    typeof (data as { error?: unknown }).error === "string"
  );
}
