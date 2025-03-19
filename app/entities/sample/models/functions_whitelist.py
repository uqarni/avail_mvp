from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List
import os
from pathlib import Path


class CSSElement(BaseModel):
    description: str
    page: str
    tours: List[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class CSSWhitelist(BaseModel):
    elements: Dict[str, CSSElement] = Field(default_factory=dict)

    def add_element(self, selector: str, description: str,
                    page: str, tours: List[str]) -> None:
        self.elements[selector] = CSSElement(
            description=description,
            page=page,
            tours=tours
        )

    def get_elements_for_tour(self, tour_name: str) -> Dict[str, CSSElement]:
        return {
            selector: element for selector, element in self.elements.items()
            if tour_name in element.tours
        }

    def save(self, filename: str = None) -> None:
        if filename is None:
            filename = self._get_default_file_path()

        # Ensure directory exists
        os.makedirs(os.path.dirname(filename), exist_ok=True)

        with open(filename, "w") as f:
            f.write(self.model_dump_json(indent=2))

    @classmethod
    def load(cls, filename: str = None) -> "CSSWhitelist":
        if filename is None:
            filename = cls._get_default_file_path()

        try:
            with open(filename, "r") as f:
                return cls.model_validate_json(f.read())
        except FileNotFoundError:
            # If the file doesn't exist at the specified path, try the default path
            if filename != cls._get_default_file_path():
                return cls.load(cls._get_default_file_path())
            raise

    @staticmethod
    def _get_default_file_path() -> str:
        """Get the absolute path to the default css_whitelist.json file"""
        # Try to find the file in the models directory
        base_dir = Path(__file__).resolve().parent
        return str(base_dir / "css_whitelist.json")

    def get_tour_descriptions(self) -> Dict[str, List[Dict]]:
        tours = {}
        for selector, element in self.elements.items():
            for tour in element.tours:
                if tour not in tours:
                    tours[tour] = []
                tours[tour].append({
                    "selector": selector,
                    "description": element.description
                })
        return tours

    def export_for_ai(self) -> Dict:
        ai_knowledge = {
            "css_elements": {},
            "tours": {}
        }

        for selector, element in self.elements.items():
            ai_knowledge["css_elements"][selector] = {
                "description": element.description,
                "applicable_tours": element.tours
            }

        tours = self.get_tour_descriptions()
        for tour_name, elements in tours.items():
            ai_knowledge["tours"][tour_name] = {
                "elements": elements
            }

        return ai_knowledge


def create_avail_whitelist() -> CSSWhitelist:
    css_whitelist = CSSWhitelist()

    css_whitelist.add_element(
        ".build-listing-btn",
        "Blue button. Click this button to start building your listing",
        "/",
        ["create_listing"]
    )

    css_whitelist.add_element(
        ".listing-builder-sidebar",
        "Side bar containing the steps to complete your listing. Follow each step to create your listing.",
        "/listing-builder",
        ["create_listing"]
    )

    return css_whitelist