# RxChain - how to run

1. Start MongoDB (local service on port 27017).
2. Backend:
       cd rxchain-backend
       npm install
       npm start
   The first start creates the demo users and the genesis block automatically.
3. Open http://localhost:5000  (backend serves the frontend too - no CORS / file:// problems)

Demo logins (Registration ID / password)
- Doctor   DOC-1024 / doctor123
- Patient  PAT-2048 / patient123
- Pharmacy PHR-3072 / pharmacy123
- Admin    ADM-4096 / admin123

If you still see "Failed to fetch": the backend is not running, or port 5000 is busy.
Check http://localhost:5000/api/health in the browser. To change the port, edit PORT in
rxchain-backend/.env and the port number in js/api.js and js/doctor/blockchain.js.
