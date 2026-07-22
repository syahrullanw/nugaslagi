"""Pure compatibility checks for the PostgreSQL document boundary."""

from backend.postgres_database import _apply_update, _project, matches


def test_query_semantics_cover_nested_fields_and_arrays():
    document = {
        "id": "one",
        "status": "active",
        "class_ids": ["a", "b"],
        "profile": {"score": 80},
    }

    assert matches(document, {"class_ids": "a"})
    assert matches(document, {"class_ids": {"$in": ["b"]}})
    assert matches(document, {"profile.score": {"$gte": 75}})
    assert matches(document, {"missing": {"$exists": False}})
    assert matches(document, {"$or": [{"status": "deleted"}, {"id": "one"}]})
    assert not matches(document, {"class_ids": {"$size": 1}})


def test_update_semantics_cover_application_operators():
    document = {"id": "one", "tags": ["a"], "nested": {"old": True}}
    updated = _apply_update(
        document,
        {
            "$set": {"nested.value": 2},
            "$unset": {"nested.old": ""},
            "$addToSet": {"tags": {"$each": ["a", "b"]}},
            "$push": {"events": {"$each": [1, 2]}},
        },
    )
    updated = _apply_update(updated, {"$pull": {"tags": "a"}})

    assert updated == {
        "id": "one",
        "tags": ["b"],
        "nested": {"value": 2},
        "events": [1, 2],
    }


def test_projection_supports_inclusion_exclusion_and_nested_fields():
    document = {"id": "one", "secret": "hidden", "nested": {"a": 1, "b": 2}}

    assert _project(document, {"_id": 0, "id": 1, "nested.a": 1}) == {
        "id": "one",
        "nested": {"a": 1},
    }
    assert _project(document, {"_id": 0, "secret": 0}) == {
        "id": "one",
        "nested": {"a": 1, "b": 2},
    }
