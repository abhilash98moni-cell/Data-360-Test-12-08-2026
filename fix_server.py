with open("server.ts", "r") as f:
    lines = f.readlines()

# Extract lines 6735 to 6815 (0-indexed 6734 to 6815)
start_idx = 6735 # 0-indexed, so line 6736
end_idx = 6815 # 0-indexed, line 6816

extracted = lines[start_idx:end_idx]
del lines[start_idx:end_idx]

# Insert them before line 6705 (0-indexed 6704)
# Wait, if we delete lines below, the indices above aren't affected.
insert_idx = 6704
lines = lines[:insert_idx] + extracted + lines[insert_idx:]

with open("server.ts", "w") as f:
    f.writelines(lines)
