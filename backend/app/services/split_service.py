import math

def split_equally(total_amount, num_people):
    """Splits the total amount equally among a number of people.

    Args:
        total_amount (float): The total amount to split.
        num_people (int): The number of people to split the bill among.

    Returns:
        dict: A dictionary containing the split details:
              {'total_amount': float, 'num_people': int, 'amount_per_person': float}
              Returns None if input is invalid.
    """
    if not isinstance(total_amount, (int, float)) or total_amount < 0:
        return {"error": "Invalid total amount"}
    if not isinstance(num_people, int) or num_people <= 0:
        return {"error": "Number of people must be a positive integer"}

    # Calculate amount per person, rounding to 2 decimal places (e.g., cents)
    # Use math.ceil to ensure the restaurant gets paid enough in case of fractions
    # Example: 10 / 3 = 3.333... -> round up to 3.34 per person? Or handle remainder?
    # Let's do standard division and round for now.
    amount_per_person = round(total_amount / num_people, 2)

    # Note: Simple rounding might lead to a total slightly different from the original
    # (e.g., 10 / 3 -> 3.33 per person * 3 = 9.99). A more robust solution
    # might distribute the remainder (e.g., one person pays an extra cent).
    # For now, keep it simple.

    return {
        'split_method': 'equal',
        'total_amount': total_amount,
        'num_people': num_people,
        'amount_per_person': amount_per_person
        # 'remainder': round(total_amount - (amount_per_person * num_people), 2) # Optional: show remainder
    }

def split_proportionally(items, assignments):
    """Splits the bill proportionally based on who ordered which items.

    Args:
        items (list): A list of item dictionaries [{'name': str, 'price': float, 'quantity': int}, ...]
                      (or similar structure containing price information).
        assignments (dict): A dictionary mapping person names (or IDs) to a list of item indices
                           or item IDs they are responsible for.
                           Example: {'Alice': [0, 2], 'Bob': [1]}

    Returns:
        dict: A dictionary mapping each person to the total amount they owe.
              Example: {'split_method': 'proportional', 'total_amount': 150.75, 'owed_by_person': {'Alice': 80.50, 'Bob': 70.25}}
              Returns {"error": ...} if calculation fails.

    NOTE: This function is a placeholder and needs the actual assignment logic implemented.
          The current implementation just returns an error message.
    """

    # TODO: Implement the actual logic for proportional splitting.
    # 1. Calculate the total cost of items assigned to each person.
    # 2. Handle items that might be shared (split their cost among relevant people).
    # 3. Consider how to distribute taxes, tips, or discounts proportionally.

    print("WARNING: Proportional splitting is not fully implemented yet.")
    print(f"Items received: {items}")
    print(f"Assignments received: {assignments}")

    # Placeholder calculation - sums all items for demonstration, does NOT use assignments
    total_amount = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
    owed_by_person = {}
    # This needs the real logic based on 'assignments'
    # Example of structure:
    # for person, item_indices in assignments.items():
    #     person_total = 0
    #     for index in item_indices:
    #         if 0 <= index < len(items):
    #             person_total += items[index].get('price', 0) * items[index].get('quantity', 1)
    #         else:
    #             return {"error": f"Invalid item index {index} for person {person}"}
    #     owed_by_person[person] = round(person_total, 2)

    return {
        "error": "Proportional splitting requires specific item assignments and is not yet fully implemented.",
        "split_method": "proportional",
        "total_amount": total_amount, # Calculated total from items
        "owed_by_person": owed_by_person # Will be empty until implemented
    }

# --- Potential Future Splitting Methods --- #

# def split_by_item(items, assignments):
#     """ Allows users to claim specific items, potentially splitting shared items.
#         Similar to proportional but might offer a UI for claiming.
#     """
#     pass

# def handle_discounts_and_tips(total, items, split_result, discount_info, tip_info, method='proportionally'):
#     """ Applies discounts and tips to a calculated split.
#         Needs rules: Apply discount before/after tax? Split tip equally or proportionally?
#     """
#     pass 