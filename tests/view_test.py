from pathlib import Path
import os
import webbrowser

import pytest
from dotenv import load_dotenv

from aps_viewer_sdk.main import APSViewer
from aps_viewer_sdk.helper import to_md_urn, get_2lo_token


def test_show_opens_html_in_browser(monkeypatch) -> None:
    load_dotenv()
    test_urn = os.getenv("TEST_URN")
    if not test_urn:
        pytest.skip("Missing TEST_URN for browser launch test")

    viewer = APSViewer(
        urn=test_urn,
        token="test-token",
        views_selector=False,
    )

    opened: dict[str, str] = {}

    def fake_open(url: str) -> bool:
        opened["url"] = url
        return True

    monkeypatch.setattr(webbrowser, "open", fake_open)

    viewer.show()

    assert "url" in opened
    assert opened["url"].startswith("file://")

    html_path = Path(opened["url"][7:])
    html = html_path.read_text(encoding="utf-8")

    assert "test-token" in html
    assert f"urn:{to_md_urn(viewer.urn)}" in html


def test_view_names_are_injected_into_html() -> None:
    load_dotenv()
    client_id = os.getenv("CLIENT_ID")
    client_secret = os.getenv("CLIENT_SECRET")
    test_urn = os.getenv("TEST_URN")
    if not client_id or not client_secret or not test_urn:
        pytest.skip("Missing CLIENT_ID/CLIENT_SECRET/TEST_URN for live viewables test")

    token = get_2lo_token(client_id, client_secret)
    viewer = APSViewer(
        urn=test_urn,
        token=token,
        views_selector=True,
    )

    html = viewer.write()

    assert len(viewer.viewables) > 0
    assert any(v["name"] in html for v in viewer.viewables)
