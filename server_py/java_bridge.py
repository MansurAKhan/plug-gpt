import json
import os
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

ROOT_DIR = Path(__file__).resolve().parents[1]
JAVA_SRC = ROOT_DIR / "java" / "src"
JAVA_BUILD = ROOT_DIR / "java" / "build"
JAVA_CLASS = "AcademicUtils"


def _java_available() -> bool:
    return subprocess.run(["which", "java"], capture_output=True, text=True).returncode == 0


def _javac_available() -> bool:
    return subprocess.run(["which", "javac"], capture_output=True, text=True).returncode == 0


def _ensure_compiled() -> bool:
    class_file = JAVA_BUILD / f"{JAVA_CLASS}.class"
    source_file = JAVA_SRC / f"{JAVA_CLASS}.java"

    if class_file.exists() and class_file.stat().st_mtime >= source_file.stat().st_mtime:
        return True

    if not _javac_available():
        return False

    JAVA_BUILD.mkdir(parents=True, exist_ok=True)
    compile_result = subprocess.run(
        ["javac", "-d", str(JAVA_BUILD), str(source_file)],
        capture_output=True,
        text=True,
        timeout=20,
    )
    return compile_result.returncode == 0


def get_text_metrics(text: str) -> Optional[Dict[str, Any]]:
    if not text.strip() or not _java_available() or not _ensure_compiled():
        return None

    try:
        proc = subprocess.run(
            ["java", "-cp", str(JAVA_BUILD), JAVA_CLASS],
            input=text,
            capture_output=True,
            text=True,
            timeout=20,
        )
        if proc.returncode != 0:
            return None
        return json.loads(proc.stdout.strip())
    except Exception:
        return None
