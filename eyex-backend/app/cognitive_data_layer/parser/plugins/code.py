"""Parser for source code files."""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

import pandas as pd

from app.cognitive_data_layer.parser.base import BaseParser, ParseResult


def _ext(source: str | Path | bytes) -> str:
    if isinstance(source, (str, Path)):
        return Path(source).suffix.lower().lstrip(".")
    return ""


def _read_text(source: str | Path | bytes, encoding: str = "utf-8") -> tuple[str, list[str]]:
    warnings: list[str] = []
    if isinstance(source, (str, Path)):
        with open(source, "rb") as f:
            raw_bytes = f.read()
    else:
        raw_bytes = source
    try:
        text = raw_bytes.decode(encoding)
    except UnicodeDecodeError:
        text = raw_bytes.decode("utf-8", errors="replace")
        warnings.append("Fallback decode with replacement characters")
    return text, warnings


class CodeParser(BaseParser):
    """Parser for source code files (.py, .js, .ts, .java, .sql, .json, .yaml, .yml).

    Extracts structure such as functions, classes, dependencies, and comments.
    """

    name = "code"
    supported_extensions = ["py", "js", "ts", "java", "sql", "json", "yaml", "yml"]

    def can_parse(self, source: str | Path | bytes, hint: str | None = None) -> bool:
        return _ext(source) in self.supported_extensions

    async def parse(
        self,
        source: str | Path | bytes,
        options: dict[str, Any] | None = None,
    ) -> ParseResult:
        ext = _ext(source)
        text, warnings = _read_text(source)
        metadata: dict[str, Any] = {"language": ext, "lines": len(text.splitlines())}

        if ext == "py":
            metadata.update(self._parse_python(text))
        elif ext in {"js", "ts", "java"}:
            metadata.update(self._parse_c_style(text))
        elif ext == "sql":
            metadata.update(self._parse_sql(text))
        elif ext in {"json", "yaml", "yml"}:
            metadata.update(self._parse_data_file(text, ext))

        df = pd.DataFrame({"line": text.splitlines()})
        return ParseResult(
            raw_data={"sheets": [{"name": "code", "data": df}]},
            format="code",
            metadata=metadata,
            warnings=warnings,
        )

    def _parse_python(self, text: str) -> dict[str, Any]:
        functions: list[str] = []
        classes: list[str] = []
        imports: list[str] = []
        try:
            tree = ast.parse(text)
        except SyntaxError as exc:
            return {"parse_error": str(exc)}

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append(node.name)
            elif isinstance(node, ast.AsyncFunctionDef):
                functions.append(node.name)
            elif isinstance(node, ast.ClassDef):
                classes.append(node.name)
            elif isinstance(node, ast.Import):
                imports.extend(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                imports.extend(f"{module}.{alias.name}" for alias in node.names)

        return {
            "functions": functions,
            "classes": classes,
            "imports": imports,
        }

    def _parse_c_style(self, text: str) -> dict[str, Any]:
        functions = re.findall(r"(?:function\s+)?(\w+)\s*\([^)]*\)\s*[{:\s]", text)
        classes = re.findall(r"(?:class|interface)\s+(\w+)", text)
        imports = re.findall(r'(?:import|require)\s*\(?[\'"]([^\'"]+)[\'"]\)?', text)
        return {"functions": functions, "classes": classes, "imports": imports}

    def _parse_sql(self, text: str) -> dict[str, Any]:
        tables: list[str] = []
        pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"\[]?(\w+)[`\"\[]?"
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            tables.append(match.group(1))
        return {"tables": tables}

    def _parse_data_file(self, text: str, ext: str) -> dict[str, Any]:
        if ext == "json":
            import json

            try:
                data = json.loads(text)
                return {"top_level_keys": list(data.keys()) if isinstance(data, dict) else []}
            except json.JSONDecodeError as exc:
                return {"parse_error": str(exc)}
        import yaml

        try:
            data = yaml.safe_load(text)
            return {"top_level_keys": list(data.keys()) if isinstance(data, dict) else []}
        except yaml.YAMLError as exc:
            return {"parse_error": str(exc)}
