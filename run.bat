pushd front_end
echo "Type-checking the front end"
call tsc --strict main.ts
popd
echo "Type-checking the back end"
pushd back_end
mypy main.py --strict --ignore-missing-imports
echo "Running"
python3 main.py
popd
echo "Done"
