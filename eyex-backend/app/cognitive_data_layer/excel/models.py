"""Pydantic models for the πX Excel Intelligence Engine."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ExcelFormula(BaseModel):
    """A formula found in an Excel cell."""

    cell: str
    formula: str
    functions: list[str] = Field(default_factory=list)
    dependencies: list[str] = Field(default_factory=list)
    sheet: str = ""


class ExcelNamedRange(BaseModel):
    """A named range defined in the workbook."""

    name: str
    value: str | None = None
    refers_to: str | None = None


class ExcelColumnInsight(BaseModel):
    """Semantic and statistical insight about a column."""

    name: str
    data_type: str = "unknown"
    semantic_type: str = "unknown"
    business_concept: str | None = None
    sample_values: list[str] = Field(default_factory=list)
    null_count: int = 0
    unique_count: int = 0
    confidence: float = 0.0


class ExcelTable(BaseModel):
    """An extracted table from an Excel sheet."""

    name: str
    sheet: str
    columns: list[ExcelColumnInsight] = Field(default_factory=list)
    row_count: int = 0
    formulas: list[ExcelFormula] = Field(default_factory=list)
    is_table_object: bool = False


class ExcelSheet(BaseModel):
    """A sheet in the workbook."""

    name: str
    index: int = 0
    hidden: bool = False
    tables: list[ExcelTable] = Field(default_factory=list)
    row_count: int = 0
    column_count: int = 0


class ExcelRelationship(BaseModel):
    """A discovered relationship between tables/sheets."""

    source_table: str
    source_column: str
    target_table: str
    target_column: str
    relationship_type: str = "foreign_key"
    confidence: float = 0.0


class ExcelQualityScore(BaseModel):
    """Data quality score for the workbook."""

    overall_score: float = 0.0
    completeness: float = 0.0
    uniqueness: float = 0.0
    consistency: float = 0.0
    issue_count: int = 0


class ExcelUnderstandingResult(BaseModel):
    """Complete understanding result for an Excel workbook."""

    file_name: str
    sheet_count: int = 0
    hidden_sheets: list[str] = Field(default_factory=list)
    named_ranges: list[ExcelNamedRange] = Field(default_factory=list)
    sheets: list[ExcelSheet] = Field(default_factory=list)
    relationships: list[ExcelRelationship] = Field(default_factory=list)
    quality: ExcelQualityScore = Field(default_factory=lambda: ExcelQualityScore())
    business_concepts: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
