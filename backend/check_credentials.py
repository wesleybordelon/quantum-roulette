from backend.quantum_service import connect_backend


def main():
    try:
        backend = connect_backend()
    except Exception as error:
        raise SystemExit(f"IBM Quantum authentication or backend discovery failed ({type(error).__name__})") from None
    print(f"IBM Quantum backend verified: {backend.name}")


if __name__ == "__main__":
    main()
