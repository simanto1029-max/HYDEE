// HYDEE Meta Conversions API endpoint
// Placeholder created to verify GitHub write access and path.
export default function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  return res.status(501).json({ success: false, error: 'CAPI implementation pending' });
}
