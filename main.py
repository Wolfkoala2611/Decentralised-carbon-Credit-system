import os
from dotenv import load_dotenv

load_dotenv()
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.genai as genai
from google.genai import types

app = FastAPI(title="CarbonChain Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database mimicking the Node.js implementation
users = {
    'buyer@demo.com': {'id': 'usr_buyer001', 'email': 'buyer@demo.com', 'password': 'Demo@1234', 'full_name': 'Arjun Sharma', 'role': 'buyer', 'wallet_address': '0x742d35Cc6634C0532925a3b8D4C9C1C3a6b8F2e1', 'eth_balance': 100.0, 'credit_balance': 0},
    'seller@demo.com': {'id': 'usr_sell001', 'email': 'seller@demo.com', 'password': 'Demo@1234', 'full_name': 'GreenEarth Pvt Ltd', 'role': 'seller', 'wallet_address': '0x891f24Aa7745D1643936b5d0E8C7D2D4b7c9E3f2', 'eth_balance': 100.0, 'credit_balance': 0},
}

evidenceVault = {
    'p1': {'score': 94, 'label': 'Excellent', 'sat_dates': ['2024-01', '2024-06', '2024-12'], 'iot_sensors': 14, 'auditor': 'Bureau Veritas', 'standard': 'Verra VCS', 'ipfs': 'QmXf8zV1b9wKpYrH3cMnP2dTqE7sAjU4iBkRo5vLxNgZ6', 'gps': '3.4653 S, 62.2159 W', 'area_ha': 50000, 'trees_count': 2400000, 'co2_verified': True, 'ai_summary': 'Strong reforestation claim with multiple satellite captures.'},
    'p2': {'score': 91, 'label': 'Excellent', 'sat_dates': ['2024-03', '2024-09'], 'iot_sensors': 8, 'auditor': 'DNV GL', 'standard': 'Gold Standard', 'ipfs': 'QmP3wYqA9mVjBnKcRd7TsE2oFuI5hLxM8gZeN4vCpWtX1', 'gps': '26.2389 N, 73.0243 E', 'area_ha': 800, 'trees_count': 0, 'co2_verified': True, 'ai_summary': 'Solar generation claim is consistent.'},
}

projects = [
    {'id': 'p1', 'name': 'Amazon Reforestation Initiative', 'type': 'REFORESTATION', 'location': 'Para, Brazil', 'available_credits': 500, 'total_credits': 1000, 'price_per_credit': 0.04, 'co2_tonnes': 500, 'verified': True, 'seller_name': 'GreenEarth Ltd', 'vintage_year': 2024},
    {'id': 'p2', 'name': 'Rajasthan Solar Farm', 'type': 'SOLAR', 'location': 'Jodhpur, Rajasthan', 'available_credits': 1200, 'total_credits': 2000, 'price_per_credit': 0.03, 'co2_tonnes': 1200, 'verified': True, 'seller_name': 'SolarCo India', 'vintage_year': 2023},
]

ledger = []
transactions = []
holdings = []
watchlist = []
sessions = {}
securityEvents = []

class LoginReq(BaseModel):
    email: str
    password: str

class RegisterReq(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    wallet_address: Optional[str] = None

class BuyReq(BaseModel):
    projectId: str
    amount: int

class RetireReq(BaseModel):
    projectId: str

class WalletReq(BaseModel):
    wallet_address: str
    eth_balance: float

def get_current_user(req: Request):
    auth = req.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    
    # Accept mock frontend tokens for demo purposes
    if token.startswith("tok_") or token == "demo_token":
        # Just return the demo buyer if they use a mock frontend token, 
        # or try to extract an email if possible. For demo, we just bypass.
        return users.get('buyer@demo.com')

    email = sessions.get(token)
    return users.get(email) if email else None

def get_state_for_user(user):
    safe_user = None
    if user:
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        
    return {
        "user": safe_user,
        "projects": projects,
        "evidenceVault": evidenceVault,
        "ledger": ledger,
        "securityEvents": securityEvents,
        "transactions": [tx for tx in transactions if tx.get('buyer_id') == user['id'] or any(p['seller_id'] == user['id'] or p['seller_name'] == user['full_name'] for p in projects if p['id'] == tx['project_id'])] if user else [],
        "holdings": [h for h in holdings if h['userId'] == user['id']] if user else [],
        "watchlist": [w for w in watchlist if w['userId'] == user['id']] if user else [],
    }

@app.get("/api/state")
def get_state(req: Request):
    user = get_current_user(req)
    return get_state_for_user(user)

@app.post("/api/auth/login")
def login(data: LoginReq):
    email = data.email.lower()
    user = users.get(email)
    if not user or user['password'] != data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = f"tok_{uuid.uuid4().hex}"
    sessions[token] = email
    
    securityEvents.insert(0, {'event_type': 'LOGIN_SUCCESS', 'ip_address': 'local', 'detail': f"{email} authenticated", 'severity': 'INFO', 'created_at': datetime.now().isoformat()})
    
    return {"token": token, "user": {k: v for k, v in user.items() if k != 'password'}, "state": get_state_for_user(user)}

@app.post("/api/auth/register")
def register(data: RegisterReq):
    email = data.email.lower()
    if email in users:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    new_user = {
        'id': f"usr_{uuid.uuid4().hex[:8]}",
        'email': email,
        'password': data.password,
        'full_name': data.full_name,
        'role': 'seller' if data.role == 'seller' else 'buyer',
        'wallet_address': data.wallet_address,
        'eth_balance': 100.0,
        'credit_balance': 0
    }
    users[email] = new_user
    token = f"tok_{uuid.uuid4().hex}"
    sessions[token] = email
    
    return {"token": token, "user": {k: v for k, v in new_user.items() if k != 'password'}, "state": get_state_for_user(new_user)}

@app.post("/api/buy")
def buy(data: BuyReq, req: Request):
    user = get_current_user(req)
    if not user or user['role'] != 'buyer':
        raise HTTPException(status_code=403, detail="Only buyers can purchase credits")
        
    project = next((p for p in projects if p['id'] == data.projectId), None)
    if not project or data.amount < 1:
        raise HTTPException(status_code=400, detail="Invalid purchase")
        
    total = data.amount * project['price_per_credit']
    if data.amount > project['available_credits']:
        raise HTTPException(status_code=400, detail="Not enough credits available")
    if total > user['eth_balance']:
        raise HTTPException(status_code=400, detail="Insufficient ETH balance")
        
    project['available_credits'] -= data.amount
    project['co2_tonnes'] = max(0, project['co2_tonnes'] - data.amount)
    user['eth_balance'] -= total
    user['credit_balance'] += data.amount
    
    txHash = f"0x{uuid.uuid4().hex}"
    tx = {
        'id': f"tx_{uuid.uuid4().hex[:8]}", 'blockchain_tx': txHash, 'project_id': project['id'],
        'project_name': project['name'], 'buyer_id': user['id'], 'credits': data.amount,
        'total_amount': f"{total:.6f}", 'seller_payout': f"{(total * 0.975):.6f}",
        'status': 'confirmed', 'created_at': datetime.now().isoformat()
    }
    transactions.append(tx)
    
    holding = next((h for h in holdings if h['userId'] == user['id'] and h['projectId'] == project['id']), None)
    if holding:
        holding['credits'] += data.amount
    else:
        holdings.append({'userId': user['id'], 'projectId': project['id'], 'credits': data.amount, 'project': project})
        
    return {"transaction": tx, "state": get_state_for_user(user)}

@app.post("/api/retire")
def retire(data: RetireReq, req: Request):
    user = get_current_user(req)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required")
        
    holding = next((h for h in holdings if h['userId'] == user['id'] and h['projectId'] == data.projectId and h['credits'] > 0), None)
    if not holding:
        raise HTTPException(status_code=400, detail="No credits to retire")
        
    holding['credits'] -= 1
    user['credit_balance'] = max(0, user['credit_balance'] - 1)
    
    ledger.append({
        'id': f"CC-R{int(datetime.now().timestamp())}", 'projectId': holding['projectId'],
        'projectName': holding['project']['name'], 'projectType': holding['project']['type'],
        'owner': 'BURNED', 'status': 'retired', 'vintage': holding['project']['vintage_year'],
        'mintedAt': datetime.now().strftime("%Y-%m-%d"), 'txHash': f"0x{uuid.uuid4().hex}", 'prevOwners': [user['wallet_address'] or user['email']]
    })
    
    return {"state": get_state_for_user(user)}

@app.post("/api/user/wallet")
def update_wallet(data: WalletReq, req: Request):
    user = get_current_user(req)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required")
    
    user['wallet_address'] = data.wallet_address
    user['eth_balance'] = data.eth_balance
    return {"state": get_state_for_user(user)}

@app.post("/api/projects")
async def create_project(
    req: Request,
    name: str = Form(...),
    type: str = Form(...),
    location: str = Form(...),
    vintage_year: int = Form(...),
    total_credits: int = Form(...),
    price_per_credit: float = Form(...),
    description: str = Form(...),
    gps: str = Form(""),
    standard: str = Form(""),
    satellite_image: UploadFile = File(None),
    document_image: UploadFile = File(None)
):
    user = get_current_user(req)
    if not user or user['role'] != 'seller':
        raise HTTPException(status_code=403, detail="Only sellers can list projects")
        
    project = {
        'id': f"p{int(datetime.now().timestamp())}",
        'name': name.strip(),
        'type': type,
        'location': location.strip(),
        'vintage_year': vintage_year,
        'total_credits': total_credits,
        'available_credits': total_credits,
        'price_per_credit': price_per_credit,
        'description': description.strip(),
        'co2_tonnes': total_credits,
        'seller_name': user['full_name'],
        'seller_id': user['id'],
        'verified': False
    }

    ai_result = {"score": 50, "label": "Pending", "co2_verified": False, "ai_summary": "Manual review required."}
    
    # Process images with Gemini API if key is available and images are provided
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key and satellite_image and document_image:
        try:
            client = genai.Client(api_key=api_key)
            sat_bytes = await satellite_image.read()
            doc_bytes = await document_image.read()
            
            prompt = f"""
            You are a carbon-credit due diligence assistant. You have been given a satellite image and an auditor document for a {project['type']} project located in {project['location']} with GPS: {gps}.
            Analyze the images and the description: "{project['description']}".
            Return a JSON object with:
            - score (integer 0-100, based on credibility of evidence)
            - label (string: 'Excellent', 'Very Good', 'Good', or 'Fraudulent/Suspicious')
            - co2_verified (boolean, true if evidence supports the claim)
            - ai_summary (string, one sentence explanation of your findings)
            - risks (list of short strings, any concerns found)
            """
            
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[
                    types.Part.from_bytes(data=sat_bytes, mime_type=satellite_image.content_type or 'image/jpeg'),
                    types.Part.from_bytes(data=doc_bytes, mime_type=document_image.content_type or 'image/jpeg'),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )
            ai_result = json.loads(response.text)
        except Exception as e:
            print(f"Gemini API error: {e}")
            ai_result["ai_summary"] = f"AI fallback used due to error: {e}"
            ai_result["score"] = 65
            ai_result["label"] = "Needs Review"
    else:
        # Fallback analysis
        has_gps = bool(gps)
        has_standard = bool(standard)
        score = max(58, min(94, 62 + (10 if has_gps else 0) + (8 if has_standard else 0)))
        ai_result = {
            "score": score,
            "label": "Excellent" if score >= 90 else "Very Good" if score >= 75 else "Good",
            "co2_verified": score >= 75,
            "ai_summary": "AI fallback review. Add real images for full verification.",
            "risks": ["Missing high-res satellite confirmation"]
        }

    project['verified'] = bool(ai_result.get('co2_verified'))
    projects.append(project)
    
    evidenceVault[project['id']] = {
        'score': int(ai_result.get('score', 0)),
        'label': ai_result.get('label', 'Pending'),
        'sat_dates': [datetime.now().strftime("%Y-%m")] if project['verified'] else [],
        'iot_sensors': max(2, min(18, round(project['total_credits'] / 100))) if project['verified'] else 0,
        'auditor': 'AI Screened' if project['verified'] else 'Pending',
        'standard': standard or 'Pending',
        'ipfs': f"Qm{uuid.uuid4().hex[:24]}",
        'gps': gps,
        'area_ha': 0,
        'trees_count': round(project['total_credits'] * 45) if project['type'] == 'REFORESTATION' else 0,
        'co2_verified': project['verified'],
        'ai_summary': ai_result.get('ai_summary', ''),
        'risks': ai_result.get('risks', [])
    }
    
    securityEvents.insert(0, {'event_type': 'AI_GREENWASH_SCAN', 'ip_address': 'internal', 'detail': f"{project['name']} scored {evidenceVault[project['id']]['score']}/100", 'severity': 'INFO' if project['verified'] else 'WARNING', 'created_at': datetime.now().isoformat()})
    
    return {"project": project, "evidence": evidenceVault[project['id']], "state": get_state_for_user(user)}

# Serve static files
app.mount("/static", StaticFiles(directory=".", html=True), name="static")

@app.get("/")
def serve_index():
    with open("carbonchain_v3.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3000)
