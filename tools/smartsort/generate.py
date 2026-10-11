import hashlib
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "eval" / "smartsort" / "v1"
SEED = 20261011

MERCHANTS = {
    "Groceries": ["Imtiaz Super Market", "Chase Up", "Al-Fatah", "Naheed Supermarket", "Metro Cash and Carry", "Carrefour", "Springs Stores", "Green Valley", "Hyperstar", "Euro Store", "Utility Stores", "Panda Mart", "Jalal Sons", "Esajees", "Madni Kiryana", "Bismillah General Store", "Qasim Grocers", "Fresh Basket", "Al Rehman Mart", "Save Mart", "Ghani Karyana Store", "Daily Needs Mart"],
    "Food and Restaurants": ["Savour Foods", "Kababjees", "Student Biryani", "Cheezious", "Broadway Pizza", "Ranchers", "Tehzeeb Bakers", "Butt Karahi", "Monal", "KFC", "McDonalds", "Hardees", "Pizza Hut", "Gloria Jeans Coffees", "foodpanda", "Bundu Khan", "OPTP", "Howdy", "Johnny and Jugnu", "Shinwari Tikka", "Hot n Spicy", "Lal Qila", "United King Bakers", "Rehmat-e-Shereen Sweets"],
    "Transport": ["Careem", "Uber", "inDrive", "Bykea", "Yango", "Daewoo Express", "Faisal Movers", "PIA", "Airblue", "SereneAir", "Pakistan Railways", "Fly Jinnah", "Skyways", "Road Master", "Peoples Bus Service", "M-Tag Motorway", "Green Line BRT", "Speedo Bus"],
    "Fuel": ["PSO", "Shell", "Total Parco", "Attock Petroleum", "Hascol", "GO Petroleum", "Byco", "Al Madina Filling Station", "Askar Fuel Point", "Zahid CNG Station", "National Petroleum", "Faisal Filling Station"],
    "Utilities": ["K-Electric", "LESCO", "IESCO", "FESCO", "MEPCO", "PESCO", "GEPCO", "HESCO", "SSGC", "SNGPL", "WASA", "KWSC Water Board", "QESCO"],
    "Mobile and Internet": ["Jazz", "Telenor", "Zong", "Ufone", "PTCL", "Nayatel", "StormFiber", "Wateen", "Worldcall", "Cybernet", "Transworld Home", "Fiberlink Internet"],
    "Education": ["Beaconhouse", "The City School", "LGS", "Roots Millennium", "LUMS", "NUST", "FAST NUCES", "Allied School", "Dar-e-Arqam", "The Educators", "Punjab Group of Colleges", "KIPS Academy", "Iqra University", "Superior College", "Bahria College", "Smart Tuition Centre"],
    "Healthcare": ["Shaukat Khanum", "Aga Khan Hospital", "Chughtai Lab", "Excel Labs", "Servaid Pharmacy", "D.Watson", "Fazal Din Pharma Plus", "Clinix", "Dawaai", "Marham", "Indus Hospital", "Doctors Hospital", "Medicare Chemist", "Green Plus Pharmacy", "Al Shifa Eye Trust", "Bilal Medical Store", "Essa Lab"],
    "Shopping": ["Daraz", "Khaadi", "Gul Ahmed", "Sapphire", "Outfitters", "Bata", "Servis", "Alkaram Studio", "Limelight", "ChenOne", "Ideas", "Breakout", "Bonanza Satrangi", "Mega.pk", "PriceOye", "Telemart", "Liberty Books", "Saeed Book Bank", "Junaid Jamshed", "Nishat Linen", "Stylo Shoes", "Hamid Garments"],
    "Entertainment": ["Netflix", "Spotify", "Cinepax", "Nueplex", "Atrium Cinemas", "Universal Cinemas", "Tapmad", "YouTube Premium", "Steam", "PlayStation Store", "Joyland", "Sindbad", "Arena Bowling", "Funland Park"],
    "Government Fees and Taxes": ["FBR", "NADRA", "Excise and Taxation", "DGIP Passport Office", "Punjab e-Challan", "Safe City Challan", "ePay Punjab", "Islamabad Traffic Police", "KPRA", "PRA", "Sindh Excise", "Board of Revenue"],
    "Charity and Zakat": ["Edhi Foundation", "Saylani Welfare", "Akhuwat", "Alkhidmat", "JDC Foundation", "Chhipa Welfare", "Al-Mustafa Welfare Trust", "TCF", "SOS Village", "Sundas Foundation", "Fatimid Foundation"],
    "Subscriptions": ["Google One", "Apple.com Bill", "Microsoft 365", "Canva Pro", "Adobe", "iCloud Storage", "Patreon", "LinkedIn Premium", "Google Play", "Dropbox", "Zoom Pro", "Grammarly"],
    "Other": ["Khan Traders", "Ali Enterprises", "Ahmed and Sons", "Al-Noor Corporation", "Star Services", "Hamza Associates", "Bilal Brothers", "Raza Agency", "Zain International", "Prime Solutions", "Haider and Co", "Sultan Enterprises", "Usman Trading", "Pak Link Services"],
}

GENERIC = {
    "Groceries": ["General Store", "Karyana Store", "Mart", "Super Store", "Grocers", "Sabzi Shop", "Cash and Carry"],
    "Food and Restaurants": ["Restaurant", "Bakers", "Sweets", "Tikka House", "Cafe", "Biryani Centre", "Foods", "Karahi"],
    "Fuel": ["Filling Station", "Petroleum", "CNG Station", "Petrol Pump", "Fuel Point"],
    "Healthcare": ["Medical Store", "Pharmacy", "Chemist", "Clinic", "Hospital", "Diagnostic Centre", "Dental Care", "Medicos"],
    "Education": ["School", "Academy", "College", "Tuition Centre", "Grammar School", "Institute"],
    "Shopping": ["Garments", "Shoes", "Book Depot", "Electronics", "Cloth House", "Boutique", "Mobile Zone"],
}

NAMES = ["Madina", "Al Habib", "Usmania", "Rehman", "Gulshan", "Faisal", "Iqbal", "Karachi", "Lahore", "Punjab", "Shah", "Noor", "Al Karam", "Sadiq", "Hafeez", "Zam Zam", "Pak", "Royal", "New City", "Bismillah", "Allah Wala", "Sialkot", "Hyderabad", "Quetta", "Peshawar", "Afzal", "Rafiq", "Kausar", "Shan", "Chaudhry"]

FAMILIES = {
    "bank_pos_en": ["Your {bank} Debit Card ending {card} was used for PKR {amt} at {m} on {date}. Avl Bal PKR {bal}.", "Dear Customer, PKR {amt} spent at {m} using card *{card} on {date}."],
    "bank_purchase_short": ["Purchase of Rs.{amt} at {m} from A/C **{card}. Ref {ref}.", "Rs {amt} purchase at {m} on card x{card}."],
    "wallet_pay_en": ["You have paid Rs {amt} to {m} from your {wallet} account. TID {ref}.", "Payment of Rs. {amt} to {m} successful. {wallet} TID: {ref}"],
    "raast_qr_en": ["PKR {amt} sent to {m} via Raast QR. Ref {ref}.", "Raast payment of PKR {amt} paid to {m} on {date}. ID {ref}"],
    "ibft_en": ["IBFT of Rs {amt} sent to {m} from A/C ***{card}. Ref# {ref}", "Funds transfer Rs. {amt} trf to {m}. Ref {ref}"],
    "bill_en": ["Bill payment of Rs {amt} for {m} successful from A/C {card}. Ref {ref}.", "Your {m} bill of PKR {amt} has been paid. Ref {ref}"],
    "online_card_en": ["Online transaction of PKR {amt} at {m} charged on your card ending {card}.", "PKR {amt} charged by {m} on your Visa card **{card}."],
    "roman_urdu": ["Aap ke account se Rs {amt} {m} ko bhej diye gaye. Ref {ref}", "Rs {amt} kat gaye {m} par card {card} se."],
    "urdu": ["آپ کے اکاؤنٹ سے {m} کو {amt} روپے بھیج دیے گئے۔ حوالہ {ref}", "{m} پر {amt} روپے کی کٹوتی ہوئی۔"],
    "bank_debit_narrative": ["A/C {card} debited PKR {amt} for {m} on {date}. Bal PKR {bal}", "PKR {amt} debited from your account for payment to {m}."],
    "wallet_merchant_en": ["{wallet}: Rs.{amt} paid at {m}. Txn ID {ref}. Balance Rs {bal}", "Paid Rs {amt} at {m} with {wallet}. Trx {ref}"],
    "card_alert_terse": ["Txn PKR{amt} {m} card{card} {date}", "POS Rs{amt} {m} *{card}"],
}

NEGATIVE_FAMILIES = {
    "otp": ["Your OTP for {wallet} is {otp}. Do not share it with anyone.", "{otp} is your verification code for {bank} login. Never share.", "Use {otp} as one-time password to approve PKR {amt} at {m}. Valid for 5 min."],
    "promo_credit_word": ["Get 20% cashback offer at {m}! Credit card offer valid till {date}. Apply now.", "Limited time: pre-approved loan offer of PKR {amt}. Apply now.", "Enjoy Rs {amt} cashback credited on your next purchase at {m}. Shop now, sale ends {date}."],
    "failed": ["Your transaction of PKR {amt} at {m} has failed.", "Payment of Rs {amt} to {m} was declined.", "Rs {amt} payment to {m} unsuccessful. No amount deducted."],
    "pending": ["Your transfer of Rs {amt} to {m} is pending.", "Payment of PKR {amt} is in process. Ref {ref}", "Raast transfer Rs {amt} to {m} under process. Ref {ref}"],
    "balance_info": ["Your {bank} account balance is PKR {bal} as of {date}.", "Avl Bal for A/C {card}: Rs {bal}.", "{wallet} balance: Rs {bal}. Last updated {date}."],
    "upcoming_debit": ["Reminder: PKR {amt} will be debited for {m} on {date}.", "Your {m} bill of Rs {amt} is due on {date}.", "Auto-debit of Rs {amt} for {m} scheduled on {date}. Keep sufficient balance."],
    "statement": ["Your e-statement for A/C {card} is ready. Login to view.", "{bank}: Your monthly statement has been generated.", "Dear customer, {bank} card statement for {date} is available in the app."],
    "request_money": ["{m} has requested Rs {amt} from you via {wallet}.", "Payment request of PKR {amt} from {m}. Tap to pay.", "{m} ne aap se Rs {amt} mangwaye hain {wallet} par."],
}

BANKS = ["HBL", "MCB", "UBL", "Meezan Bank", "Bank Alfalah", "Allied Bank", "Bank Al Habib", "Faysal Bank"]
WALLETS = ["JazzCash", "Easypaisa", "SadaPay", "NayaPay"]

SPLIT_FAMILIES = {
    "train": ["bank_pos_en", "wallet_pay_en", "ibft_en", "bill_en", "roman_urdu", "bank_debit_narrative"],
    "val": ["bank_purchase_short", "online_card_en", "urdu"],
    "test": ["raast_qr_en", "wallet_merchant_en", "card_alert_terse"],
}

NEG_SPLIT = {
    "train": [0],
    "val": [1],
    "test": [2],
}


def bucket(value, salt):
    digest = hashlib.sha256(f"{salt}:{value}".encode()).digest()[0]
    return "train" if digest < 154 else ("val" if digest < 205 else "test")


def merchant_pool(split):
    pool = {}
    for category, names in MERCHANTS.items():
        pool[category] = [name for name in names if bucket(name, "merchant") == split]
    for category, suffixes in GENERIC.items():
        for suffix in suffixes:
            for prefix in NAMES:
                if bucket(prefix, "prefix") == split:
                    pool[category].append(f"{prefix} {suffix}")
    return pool


def fill(template, rng, merchant):
    return template.format(
        m=merchant,
        amt=f"{rng.randint(1, 900) * 50:,}",
        bal=f"{rng.randint(1000, 900000):,}",
        card=f"{rng.randint(1000, 9999)}",
        ref=f"T{rng.randint(10000000, 99999999)}",
        date=f"{rng.randint(1, 28):02d}-{rng.choice(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'])}-2026",
        bank=rng.choice(BANKS),
        wallet=rng.choice(WALLETS),
        otp=f"{rng.randint(100000, 999999)}",
    )


def build(split, rng):
    pool = merchant_pool(split)
    rows = []
    for family in SPLIT_FAMILIES[split]:
        for template in FAMILIES[family]:
            for category, merchants in pool.items():
                if not merchants:
                    continue
                count = 14 if split == "train" else 6
                for _ in range(count):
                    merchant = rng.choice(merchants)
                    rows.append({"split": split, "task": "category", "family": family, "label": category, "financial": True, "merchant": merchant, "text": fill(template, rng, merchant)})
    for family, templates in NEGATIVE_FAMILIES.items():
        indexes = NEG_SPLIT[split]
        for index in indexes:
            template = templates[index]
            for _ in range(40 if split == "train" else 25):
                merchant = rng.choice(rng.choice([m for m in pool.values() if m]))
                rows.append({"split": split, "task": "gate", "family": f"neg_{family}_{index}", "label": family, "financial": False, "merchant": merchant, "text": fill(template, rng, merchant)})
    return rows


def main():
    rng = random.Random(SEED)
    OUT.mkdir(parents=True, exist_ok=True)
    summary = {}
    for split in ("train", "val", "test"):
        rows = build(split, rng)
        with open(OUT / f"{split}.jsonl", "w", encoding="utf-8", newline="\n") as handle:
            for index, row in enumerate(rows):
                row["id"] = f"{split}-{index:05d}"
                handle.write(json.dumps(row, ensure_ascii=False) + "\n")
        summary[split] = {
            "rows": len(rows),
            "families": sorted({row["family"] for row in rows}),
            "merchants": len({row["merchant"] for row in rows if row["task"] == "category"}),
            "labels": {label: sum(1 for row in rows if row["label"] == label) for label in sorted({row["label"] for row in rows})},
        }
    train = set(summary["train"]["families"])
    for split in ("val", "test"):
        assert not train & set(summary[split]["families"]), split
    lexicon = {category: sorted(name for name in names if bucket(name, "merchant") != "test") for category, names in MERCHANTS.items() if category != "Other"}
    (OUT / "lexicon_train_val.json").write_text(json.dumps(lexicon, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT / "summary.json").write_text(json.dumps({"seed": SEED, "splits": summary}, indent=2), encoding="utf-8")
    print(json.dumps({split: summary[split]["rows"] for split in summary}))


if __name__ == "__main__":
    main()
