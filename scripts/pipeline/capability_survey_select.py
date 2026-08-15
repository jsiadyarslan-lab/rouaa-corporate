#!/usr/bin/env python3
"""
Capability Survey V1 — Sample Selection

Per CAPABILITY_SURVEY_PROTOCOL_V1.md (corrected at 2e33039, APPROVED by user).

Strategy:
- Universe = 178 sources (frozen at 8b1e7b4)
- Exclude ~15 already-tested sources (BaFin, Eurostat, FED_ENF, ABS, TCMB,
  US Treasury, RBI, Bundesbank, Banca d'Italia, OCC, SEBI, PRA, INSEE, FSB,
  UK HM Treasury)
- Stratified random sample of 32 sources by exact institutional_class
  (B1=8, B2=7, B3=4, B4=3, B5=2, B6=3, B7=2, B8=2, B9=1)
- Fixed seed for reproducibility

This script ONLY produces the sample manifest — it does NOT probe any source.
Probing is done by the survey execution script.
"""
import json
import random
from pathlib import Path

# Seed fixed per protocol — must NOT be changed without version bump
RANDOM_SEED = 20260815

# Already-tested sources — excluded from sampling per protocol Section 3.2
EXCLUDED_TESTED = {
    "BaFin",
    "Eurostat",
    "FED_ENF",
    "ABS",
    "TCMB",
    "US Treasury",
    "RBI",
    "Bundesbank",
    "Banca d'Italia",
    "OCC",
    "SEBI",
    "PRA",
    "INSEE",
    "FSB",
    "UK HM Treasury",
    # Also exclude the QUALIFIED sources (already operational evidence)
    "European Central Bank",
    "US Federal Reserve System",
    "Bank of England",
    "Bank of Japan",
    "Swiss National Bank",
    "Bank of Canada",
    "US SEC",
    "US CFTC",
    "UK FCA",
    "US Bureau of Economic Analysis",
    "BIS",
    "OFAC (US Treasury)",
    # Also exclude the SCREENED sources (already tested via pre-screening)
    "ESMA",
    "UK ONS",
    "Reserve Bank of Australia",
    "Reserve Bank of New Zealand",
    "IMF",
    # Also exclude Replication Batch / Remediation sources (already evidence)
    "Fed Banking Supervision",  # FED_ENF
    "Central Bank of Turkey",  # TCMB (remediation test)
    "PRA (UK)",  # prospective v2 CONTENT-PATH REVIEW
    "SEBI (India)",  # prospective v2 CONTENT-PATH REVIEW
}

# Per-stratum sample targets (proportional with min floor = 1)
STRATA_TARGETS = {
    "B1": 8,  # 45 total in Universe
    "B2": 7,  # 35 total
    "B3": 4,  # 25 total
    "B4": 3,  # 16 total
    "B5": 2,  # 13 total
    "B6": 3,  # 17 total
    "B7": 2,  # 11 total
    "B8": 2,  # 10 total
    "B9": 1,  # 6 total
}
# Sum = 32


# All 178 sources from GLOBAL_SOURCE_UNIVERSE_V1.md (Part B)
# Format: (institution_name, stratum, country, region, tier, status)
ALL_SOURCES = [
    # B1 — Central Banks (45)
    ("European Central Bank", "B1", "EU", "Europe", "T1", "QUALIFIED"),
    ("US Federal Reserve System", "B1", "US", "N. America", "T1", "QUALIFIED"),
    ("Bank of England", "B1", "UK", "Europe", "T1", "QUALIFIED"),
    ("Bank of Japan", "B1", "JP", "E. Asia", "T1", "QUALIFIED"),
    ("People's Bank of China", "B1", "CN", "E. Asia", "T1", "DISCOVERED"),
    ("Swiss National Bank", "B1", "CH", "Europe", "T1", "QUALIFIED"),
    ("Bank of Canada", "B1", "CA", "N. America", "T1", "QUALIFIED"),
    ("Reserve Bank of Australia", "B1", "AU", "Oceania", "T2", "SCREENED"),
    ("Reserve Bank of New Zealand", "B1", "NZ", "Oceania", "T2", "SCREENED"),
    ("Sveriges Riksbank", "B1", "SE", "Europe", "T2", "DISCOVERED"),
    ("Norges Bank", "B1", "NO", "Europe", "T2", "DISCOVERED"),
    ("Danmarks Nationalbank", "B1", "DK", "Europe", "T2", "DISCOVERED"),
    ("Bank of Korea", "B1", "KR", "E. Asia", "T2", "DISCOVERED"),
    ("Reserve Bank of India", "B1", "IN", "S. Asia", "T2", "DISCOVERED"),
    ("Central Bank of Brazil", "B1", "BR", "LATAM", "T2", "DISCOVERED"),
    ("Bank of Mexico", "B1", "MX", "LATAM", "T2", "DISCOVERED"),
    ("South African Reserve Bank", "B1", "ZA", "Africa", "T2", "DISCOVERED"),
    ("Central Bank of the UAE", "B1", "AE", "Middle East", "T2", "DISCOVERED"),
    ("Saudi Central Bank (SAMA)", "B1", "SA", "Middle East", "T2", "DISCOVERED"),
    ("Central Bank of Turkey", "B1", "TR", "Middle East", "T2", "DISCOVERED"),
    ("Bank Negara Malaysia", "B1", "MY", "SE Asia", "T3", "DISCOVERED"),
    ("Bangko Sentral ng Pilipinas", "B1", "PH", "SE Asia", "T3", "DISCOVERED"),
    ("Bank of Thailand", "B1", "TH", "SE Asia", "T3", "DISCOVERED"),
    ("Bank Indonesia", "B1", "ID", "SE Asia", "T3", "DISCOVERED"),
    ("State Bank of Pakistan", "B1", "PK", "S. Asia", "T3", "DISCOVERED"),
    ("Bangladesh Bank", "B1", "BD", "S. Asia", "T3", "DISCOVERED"),
    ("Central Bank of Egypt", "B1", "EG", "Africa", "T3", "DISCOVERED"),
    ("Central Bank of Nigeria", "B1", "NG", "Africa", "T3", "DISCOVERED"),
    ("Bank of Ghana", "B1", "GH", "Africa", "T3", "DISCOVERED"),
    ("Central Bank of Kenya", "B1", "KE", "Africa", "T3", "DISCOVERED"),
    ("Banco Central de Chile", "B1", "CL", "LATAM", "T3", "DISCOVERED"),
    ("Banco de la República (Colombia)", "B1", "CO", "LATAM", "T3", "DISCOVERED"),
    ("Banco Central do Brasil", "B1", "BR", "LATAM", "T2", "DISCOVERED"),
    ("Central Bank of Argentina", "B1", "AR", "LATAM", "T3", "DISCOVERED"),
    ("Central Bank of Russia", "B1", "RU", "Europe", "T2", "DISCOVERED"),
    ("Czech National Bank", "B1", "CZ", "Europe", "T3", "DISCOVERED"),
    ("National Bank of Poland", "B1", "PL", "Europe", "T3", "DISCOVERED"),
    ("National Bank of Hungary", "B1", "HU", "Europe", "T3", "DISCOVERED"),
    ("Central Bank of Ireland", "B1", "IE", "Europe", "T3", "DISCOVERED"),
    ("De Nederlandsche Bank", "B1", "NL", "Europe", "T2", "DISCOVERED"),
    ("Banque de France", "B1", "FR", "Europe", "T2", "DISCOVERED"),
    ("Bundesbank", "B1", "DE", "Europe", "T2", "DISCOVERED"),
    ("Banca d'Italia", "B1", "IT", "Europe", "T2", "DISCOVERED"),
    ("Banco de España", "B1", "ES", "Europe", "T2", "DISCOVERED"),
    ("Central Bank of Singapore", "B1", "SG", "SE Asia", "T2", "DISCOVERED"),

    # B2 — Financial Regulators (35)
    ("US SEC", "B2", "US", "N. America", "T1", "QUALIFIED"),
    ("US CFTC", "B2", "US", "N. America", "T1", "QUALIFIED"),
    ("UK FCA", "B2", "UK", "Europe", "T1", "QUALIFIED"),
    ("ESMA", "B2", "EU", "Europe", "T1", "SCREENED"),
    ("FINMA", "B2", "CH", "Europe", "T2", "DISCOVERED"),
    ("BaFin", "B2", "DE", "Europe", "T2", "DISCOVERED"),
    ("AMF (France)", "B2", "FR", "Europe", "T2", "DISCOVERED"),
    ("CONSOB (Italy)", "B2", "IT", "Europe", "T2", "DISCOVERED"),
    ("CNMV (Spain)", "B2", "ES", "Europe", "T3", "DISCOVERED"),
    ("AFM (Netherlands)", "B2", "NL", "Europe", "T3", "DISCOVERED"),
    ("IIROC (Canada)", "B2", "CA", "N. America", "T3", "DISCOVERED"),
    ("ASIC (Australia)", "B2", "AU", "Oceania", "T2", "DISCOVERED"),
    ("MAS (Singapore)", "B2", "SG", "SE Asia", "T2", "DISCOVERED"),
    ("SFC (Hong Kong)", "B2", "HK", "E. Asia", "T2", "DISCOVERED"),
    ("JFSA (Japan)", "B2", "JP", "E. Asia", "T2", "DISCOVERED"),
    ("CSRC (China)", "B2", "CN", "E. Asia", "T2", "DISCOVERED"),
    ("SEBI (India)", "B2", "IN", "S. Asia", "T2", "DISCOVERED"),
    ("CVM (Brazil)", "B2", "BR", "LATAM", "T3", "DISCOVERED"),
    ("CNV (Argentina)", "B2", "AR", "LATAM", "T3", "DISCOVERED"),
    ("FSRA (UAE)", "B2", "AE", "Middle East", "T3", "DISCOVERED"),
    ("CMA (Saudi Arabia)", "B2", "SA", "Middle East", "T3", "DISCOVERED"),
    ("FSC (South Korea)", "B2", "KR", "E. Asia", "T2", "DISCOVERED"),
    ("SC (Malaysia)", "B2", "MY", "SE Asia", "T3", "DISCOVERED"),
    ("SEC Thailand", "B2", "TH", "SE Asia", "T3", "DISCOVERED"),
    ("SEC Philippines", "B2", "PH", "SE Asia", "T3", "DISCOVERED"),
    ("Central Bank of Ireland (regulatory)", "B2", "IE", "Europe", "T3", "DISCOVERED"),
    ("CSSF (Luxembourg)", "B2", "LU", "Europe", "T3", "DISCOVERED"),
    ("ECB Banking Supervision", "B2", "EU", "Europe", "T2", "DISCOVERED"),
    ("Fed Banking Supervision", "B2", "US", "N. America", "T2", "DISCOVERED"),
    ("OCC", "B2", "US", "N. America", "T2", "DISCOVERED"),
    ("FDIC", "B2", "US", "N. America", "T2", "DISCOVERED"),
    ("CFPB", "B2", "US", "N. America", "T3", "DISCOVERED"),
    ("NCUA", "B2", "US", "N. America", "T3", "DISCOVERED"),
    ("PRA (UK)", "B2", "UK", "Europe", "T2", "DISCOVERED"),
    ("Federal Financial Supervisory Authority (BaFin)", "B2", "DE", "Europe", "T2", "DISCOVERED"),

    # B3 — Statistical Agencies (25)
    ("US Bureau of Economic Analysis", "B3", "US", "N. America", "T1", "QUALIFIED"),
    ("US Bureau of Labor Statistics", "B3", "US", "N. America", "T1", "DISCOVERED"),
    ("UK ONS", "B3", "UK", "Europe", "T2", "SCREENED"),
    ("Eurostat", "B3", "EU", "Europe", "T2", "DISCOVERED"),
    ("Statistics Canada", "B3", "CA", "N. America", "T2", "DISCOVERED"),
    ("ABS (Australia)", "B3", "AU", "Oceania", "T2", "DISCOVERED"),
    ("Stats NZ", "B3", "NZ", "Oceania", "T3", "DISCOVERED"),
    ("Statistics Japan", "B3", "JP", "E. Asia", "T3", "DISCOVERED"),
    ("NBS (China)", "B3", "CN", "E. Asia", "T2", "DISCOVERED"),
    ("NSO (India)", "B3", "IN", "S. Asia", "T2", "DISCOVERED"),
    ("IBGE (Brazil)", "B3", "BR", "LATAM", "T3", "DISCOVERED"),
    ("INEGI (Mexico)", "B3", "MX", "LATAM", "T3", "DISCOVERED"),
    ("DANE (Colombia)", "B3", "CO", "LATAM", "T3", "DISCOVERED"),
    ("INSEE (France)", "B3", "FR", "Europe", "T2", "DISCOVERED"),
    ("Destatis (Germany)", "B3", "DE", "Europe", "T2", "DISCOVERED"),
    ("ISTAT (Italy)", "B3", "IT", "Europe", "T3", "DISCOVERED"),
    ("INE (Spain)", "B3", "ES", "Europe", "T3", "DISCOVERED"),
    ("CBS (Netherlands)", "B3", "NL", "Europe", "T3", "DISCOVERED"),
    ("SCB (Sweden)", "B3", "SE", "Europe", "T3", "DISCOVERED"),
    ("SSB (Norway)", "B3", "NO", "Europe", "T3", "DISCOVERED"),
    ("Statistik Austria", "B3", "AT", "Europe", "T3", "DISCOVERED"),
    ("FSO (Switzerland)", "B3", "CH", "Europe", "T3", "DISCOVERED"),
    ("Stats SA", "B3", "ZA", "Africa", "T3", "DISCOVERED"),
    ("NBS (Nigeria)", "B3", "NG", "Africa", "T3", "DISCOVERED"),
    ("Kenya National Bureau of Statistics", "B3", "KE", "Africa", "T3", "DISCOVERED"),

    # B4 — Ministries of Finance (16)
    ("US Treasury", "B4", "US", "N. America", "T1", "DISCOVERED"),
    ("UK HM Treasury", "B4", "UK", "Europe", "T2", "DISCOVERED"),
    ("Federal Ministry of Finance (Germany)", "B4", "DE", "Europe", "T2", "DISCOVERED"),
    ("Ministero dell'Economia (Italy)", "B4", "IT", "Europe", "T3", "DISCOVERED"),
    ("Ministère de l'Économie (France)", "B4", "FR", "Europe", "T2", "DISCOVERED"),
    ("Ministry of Finance (Japan)", "B4", "JP", "E. Asia", "T2", "DISCOVERED"),
    ("Ministry of Finance (China)", "B4", "CN", "E. Asia", "T2", "DISCOVERED"),
    ("Ministry of Finance (India)", "B4", "IN", "S. Asia", "T2", "DISCOVERED"),
    ("Ministry of Finance (Brazil)", "B4", "BR", "LATAM", "T3", "DISCOVERED"),
    ("Ministry of Finance (Saudi Arabia)", "B4", "SA", "Middle East", "T3", "DISCOVERED"),
    ("Ministry of Finance (UAE)", "B4", "AE", "Middle East", "T3", "DISCOVERED"),
    ("Ministry of Finance (South Africa)", "B4", "ZA", "Africa", "T3", "DISCOVERED"),
    ("Ministry of Finance (Singapore)", "B4", "SG", "SE Asia", "T2", "DISCOVERED"),
    ("Ministry of Finance (South Korea)", "B4", "KR", "E. Asia", "T2", "DISCOVERED"),
    ("Department of Finance (Canada)", "B4", "CA", "N. America", "T2", "DISCOVERED"),
    ("Department of Finance (Australia)", "B4", "AU", "Oceania", "T2", "DISCOVERED"),

    # B5 — Market Infrastructure (13)
    ("CME Group", "B5", "US", "N. America", "T3", "DISCOVERED"),
    ("LSE Group", "B5", "UK", "Europe", "T3", "DISCOVERED"),
    ("NYSE", "B5", "US", "N. America", "T3", "DISCOVERED"),
    ("Euronext", "B5", "EU", "Europe", "T3", "DISCOVERED"),
    ("Deutsche Börse", "B5", "DE", "Europe", "T3", "DISCOVERED"),
    ("Japan Exchange Group", "B5", "JP", "E. Asia", "T3", "DISCOVERED"),
    ("HKEX", "B5", "HK", "E. Asia", "T3", "DISCOVERED"),
    ("Singapore Exchange", "B5", "SG", "SE Asia", "T3", "DISCOVERED"),
    ("BM&F Bovespa", "B5", "BR", "LATAM", "T3", "DISCOVERED"),
    ("ASX", "B5", "AU", "Oceania", "T3", "DISCOVERED"),
    ("DTCC", "B5", "US", "N. America", "T3", "DISCOVERED"),
    ("Euroclear", "B5", "EU", "Europe", "T3", "DISCOVERED"),
    ("LME", "B5", "UK", "Europe", "T3", "DISCOVERED"),

    # B6 — Public/Sovereign (17)
    ("China Investment Corporation", "B6", "CN", "E. Asia", "T3", "DISCOVERED"),
    ("GIC (Singapore)", "B6", "SG", "SE Asia", "T3", "DISCOVERED"),
    ("Temasek", "B6", "SG", "SE Asia", "T3", "DISCOVERED"),
    ("ADIA (UAE)", "B6", "AE", "Middle East", "T3", "DISCOVERED"),
    ("PIF (Saudi Arabia)", "B6", "SA", "Middle East", "T3", "DISCOVERED"),
    ("Norges Bank Investment Management", "B6", "NO", "Europe", "T3", "DISCOVERED"),
    ("GPIC (Kuwait)", "B6", "KW", "Middle East", "T3", "DISCOVERED"),
    ("QIA (Qatar)", "B6", "QA", "Middle East", "T3", "DISCOVERED"),
    ("KIC (Korea)", "B6", "KR", "E. Asia", "T3", "DISCOVERED"),
    ("African Development Bank", "B6", "INT", "Africa", "T3", "DISCOVERED"),
    ("Asian Development Bank", "B6", "INT", "SE Asia", "T3", "DISCOVERED"),
    ("EIB (European Investment Bank)", "B6", "EU", "Europe", "T3", "DISCOVERED"),
    ("NIB (Nordic Investment Bank)", "B6", "EU", "Europe", "T4", "DISCOVERED"),
    ("World Bank Group", "B6", "INT", "Global", "T1", "DISCOVERED"),
    ("EBRD", "B6", "EU", "Europe", "T3", "DISCOVERED"),
    ("AIIB", "B6", "INT", "E. Asia", "T3", "DISCOVERED"),
    ("NDB (BRICS)", "B6", "INT", "Global", "T3", "DISCOVERED"),

    # B7 — Multilateral (11)
    ("BIS", "B7", "INT", "Global", "T1", "QUALIFIED"),
    ("IMF", "B7", "INT", "Global", "T1", "SCREENED"),
    ("World Bank Group", "B7", "INT", "Global", "T1", "DISCOVERED"),
    ("OECD", "B7", "INT", "Global", "T2", "DISCOVERED"),
    ("FSB", "B7", "INT", "Global", "T2", "DISCOVERED"),
    ("IAIS", "B7", "INT", "Global", "T3", "DISCOVERED"),
    ("IOSCO", "B7", "INT", "Global", "T3", "DISCOVERED"),
    ("IASB (IFRS Foundation)", "B7", "INT", "Global", "T3", "DISCOVERED"),
    ("FATF", "B7", "INT", "Global", "T2", "DISCOVERED"),
    ("G20", "B7", "INT", "Global", "T3", "DISCOVERED"),
    ("Basel Committee", "B7", "INT", "Global", "T3", "DISCOVERED"),

    # B8 — Disclosure Systems (10)
    ("SEC EDGAR", "B8", "US", "N. America", "T2", "DISCOVERED"),
    ("Companies House (UK)", "B8", "UK", "Europe", "T3", "DISCOVERED"),
    ("AMF document database (France)", "B8", "FR", "Europe", "T3", "DISCOVERED"),
    ("Bundesanzeiger (Germany)", "B8", "DE", "Europe", "T3", "DISCOVERED"),
    ("CONSOB database (Italy)", "B8", "IT", "Europe", "T3", "DISCOVERED"),
    ("SEDAR+ (Canada)", "B8", "CA", "N. America", "T3", "DISCOVERED"),
    ("ASX announcements", "B8", "AU", "Oceania", "T3", "DISCOVERED"),
    ("HKEX disclosure", "B8", "HK", "E. Asia", "T3", "DISCOVERED"),
    ("SGXNET (Singapore)", "B8", "SG", "SE Asia", "T3", "DISCOVERED"),
    ("JSDA (Japan)", "B8", "JP", "E. Asia", "T3", "DISCOVERED"),

    # B9 — Other Authoritative (6)
    ("OFAC (US Treasury)", "B9", "US", "N. America", "T1", "QUALIFIED"),
    ("FinCEN", "B9", "US", "N. America", "T2", "DISCOVERED"),
    ("SRB (Single Resolution Board)", "B9", "EU", "Europe", "T3", "DISCOVERED"),
    ("EBA", "B9", "EU", "Europe", "T2", "DISCOVERED"),
    ("EIOPA", "B9", "EU", "Europe", "T3", "DISCOVERED"),
    ("ECB Statistical Data Warehouse", "B9", "EU", "Europe", "T2", "DISCOVERED"),
]


def select_sample():
    """Stratified random sample with fixed seed."""
    random.seed(RANDOM_SEED)

    # Group sources by stratum, excluding tested sources
    by_stratum = {}
    excluded_count = 0
    for src in ALL_SOURCES:
        name, stratum, country, region, tier, status = src
        if name in EXCLUDED_TESTED:
            excluded_count += 1
            continue
        by_stratum.setdefault(stratum, []).append(src)

    print(f"Total sources in Universe: {len(ALL_SOURCES)}")
    print(f"Excluded (already-tested): {excluded_count}")
    print(f"Untested population: {len(ALL_SOURCES) - excluded_count}")
    print()

    sample = []
    allocation = {}
    for stratum in sorted(STRATA_TARGETS.keys()):
        target = STRATA_TARGETS[stratum]
        candidates = by_stratum.get(stratum, [])
        # Sort for deterministic ordering BEFORE random shuffle
        candidates_sorted = sorted(candidates, key=lambda s: s[0])
        # Random sample within stratum
        if len(candidates_sorted) <= target:
            selected = candidates_sorted
        else:
            selected = random.sample(candidates_sorted, target)
        allocation[stratum] = {
            "untested_population": len(candidates),
            "sample_target": target,
            "actual_sampled": len(selected),
            "selected": [s[0] for s in selected],
        }
        sample.extend(selected)

    print(f"Allocation (per stratum):")
    for s in sorted(STRATA_TARGETS.keys()):
        a = allocation[s]
        print(f"  {s}: population={a['untested_population']} target={a['sample_target']} actual={a['actual_sampled']}")
    print(f"\nTotal sample: {len(sample)}")

    return sample, allocation


def main():
    sample, allocation = select_sample()

    # Save manifest
    output_dir = Path("/home/z/my-project/rouaa-corporate/docs/evidence/capability_survey")
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "protocol_version": "CAPABILITY_SURVEY_PROTOCOL_V1.md (corrected at 2e33039)",
        "protocol_status": "APPROVED",
        "random_seed": RANDOM_SEED,
        "universe_total": len(ALL_SOURCES),
        "excluded_tested": len(EXCLUDED_TESTED),
        "untested_population": len(ALL_SOURCES) - len(EXCLUDED_TESTED),
        "sample_size": len(sample),
        "stratification_field": "institutional_class (exact from Global Source Universe v1, frozen at 8b1e7b4)",
        "allocation": allocation,
        "sample": [
            {
                "institution": s[0],
                "stratum": s[1],
                "country": s[2],
                "region": s[3],
                "tier": s[4],
                "universe_status": s[5],
            }
            for s in sample
        ],
    }

    output_file = output_dir / "sample_manifest.json"
    output_file.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nManifest saved to: {output_file}")

    # Also print sample list for visual verification
    print(f"\n--- SAMPLE LIST (n={len(sample)}) ---")
    for i, s in enumerate(sample, 1):
        print(f"{i:2}. [{s[1]}] {s[0]} ({s[2]})")


if __name__ == "__main__":
    main()
