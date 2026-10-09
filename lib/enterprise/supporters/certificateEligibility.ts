export const issuedCertificateTransaction = "bf1ef08b-fbda-4e33-84d6-9a20bd8006dd";
export function certificateEligible(payment: { id: string; status: string; amount: unknown; units: unknown; entrepreneur_id: string }) {
  return payment.id === issuedCertificateTransaction && payment.status === "paid" && Number(payment.amount) === 5200 && Number(payment.units) === 1 && payment.entrepreneur_id === "1bccc3e1-0681-4caf-956e-4d326f2990bb";
}
