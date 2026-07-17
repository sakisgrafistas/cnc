export default async function handler(req, res) {
    // 1. Έλεγχος ασφαλείας (PIN)
    const clientPin = req.headers['x-pin'];
    if (clientPin !== process.env.SECRET_PIN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Ανάγνωση των κρυφών κωδικών του Vercel KV (Upstash)
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    // --- ΖΗΤΗΣΗ ΔΕΔΟΜΕΝΩΝ ΑΠΟ ΤΟ APP (GET) ---
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${kvUrl}/get/clickclip_crm`, {
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            const data = await response.json();
            
            let db = { clients: [], expenses: [] };
            if (data.result) {
                // Αν υπάρχουν ήδη δεδομένα στη βάση, τα μετατρέπουμε σε αντικείμενο
                db = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            }
            return res.status(200).json(db);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to read database' });
        }
    }

    // --- ΑΠΟΘΗΚΕΥΣΗ ΝΕΩΝ ΔΕΔΟΜΕΝΩΝ (POST) ---
    if (req.method === 'POST') {
        try {
            await fetch(`${kvUrl}/set/clickclip_crm`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${kvToken}` },
                body: JSON.stringify(req.body)
            });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to write to database' });
        }
    }

    res.status(405).json({ error: 'Method Not Allowed' });
}
