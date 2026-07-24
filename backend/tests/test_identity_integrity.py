from backend.identity_integrity import (
    normalize_nim,
    replace_exact_identity,
    student_identity_conflict_query,
    student_identity_values,
)
from backend.scripts.repair_duplicate_student_identities import safe_inactive_merge_reference


def test_student_identity_values_are_normalized_consistently():
    assert student_identity_values(
        " Student@Example.ID ",
        " 24ab010 ",
        "",
        " 628123 ",
    ) == {
        "email": "student@example.id",
        "nim": "24AB010",
        "username": "24ab010",
        "whatsapp": "628123",
    }
    assert normalize_nim(" 24010230 ") == "24010230"


def test_student_conflict_query_covers_all_login_identities():
    query = student_identity_conflict_query(
        "student@example.id",
        "24010230",
        "24010230",
        "628123",
        exclude_user_id="current-user",
    )

    assert query["id"] == {"$ne": "current-user"}
    assert query["$or"] == [
        {"email": "student@example.id"},
        {"nim": "24010230"},
        {"username": "24010230"},
        {"whatsapp": "628123"},
    ]


def test_exact_identity_replacement_deduplicates_membership_arrays_only():
    document = {
        "student_ids": ["target", "source"],
        "nested": {"student_id": "source", "label": "source-suffix"},
        "objects": [{"user_id": "source"}, {"user_id": "target"}],
    }

    assert replace_exact_identity(document, "source", "target") == {
        "student_ids": ["target"],
        "nested": {"student_id": "target", "label": "source-suffix"},
        "objects": [{"user_id": "target"}, {"user_id": "target"}],
    }


def test_inactive_merge_accepts_only_class_membership_references():
    assert safe_inactive_merge_reference(
        "classes",
        {"id": "class-one", "student_ids": ["source"], "lecturer_id": "lecturer"},
        "source",
    )
    assert not safe_inactive_merge_reference(
        "submissions",
        {"id": "submission-one", "student_id": "source"},
        "source",
    )
    assert not safe_inactive_merge_reference(
        "classes",
        {"id": "class-one", "student_ids": ["source"], "created_by": "source"},
        "source",
    )
