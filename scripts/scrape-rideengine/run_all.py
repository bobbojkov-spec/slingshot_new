#!/usr/bin/env python3
"""
Ride Engine Master Scraper - Run all steps sequentially
This script executes all scraping steps in order
"""

import subprocess
import sys
from pathlib import Path

SCRIPTS = [
    ("001_download_products.py", "Download all products"),
    ("002_download_collections.py", "Download all collections/categories"),
    ("003_download_images.py", "Download all product images"),
    ("004_prepare_import.py", "Prepare data for database import"),
]

def run_script(script_name, description):
    """Run a single script"""
    print("\n" + "="*60)
    print(f"  RUNNING: {description}")
    print("="*60)
    
    script_path = Path(__file__).parent / script_name
    
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            check=True,
            capture_output=False
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Script failed: {script_name}")
        print(f"   Error: {e}")
        return False

def main():
    """Main execution function"""
    print("="*60)
    print("  RIDE ENGINE MASTER SCRAPER")
    print("  Complete data extraction pipeline")
    print("="*60)
    
    for script_name, description in SCRIPTS:
        success = run_script(script_name, description)
        
        if not success:
            print(f"\n❌ Pipeline failed at: {script_name}")
            print("   Fix the error and run again.")
            sys.exit(1)
    
    print("\n\n" + "="*60)
    print("  ✅ ALL STEPS COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("\n🎉 Ride Engine data is ready for import!")
    print("   Check the 'rideengine_data/import_ready' folder")

if __name__ == "__main__":
    main()
