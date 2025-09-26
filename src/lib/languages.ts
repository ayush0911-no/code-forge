export type Language = {
  value: string;
  label: string;
  extension: string;
};

export const languages: Language[] = [
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'c', label: 'C', extension: 'c' },
  { value: 'cpp', label: 'C++', extension: 'cpp' },
];

export const defaultCode: Record<string, string> = {
  python: `def main():
    try:
        num_str = input("Enter a number: ")
        number = int(num_str)
        print(f"You entered the number: {number}")
    except ValueError:
        print("That's not a valid number!")

if __name__ == "__main__":
    main()
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter a number: ");
        try {
            int number = scanner.nextInt();
            System.out.println("You entered the number: " + number);
        } catch (java.util.InputMismatchException e) {
            System.out.println("That's not a valid number!");
        } finally {
            scanner.close();
        }
    }
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    char str[100];
    int num;
    char term;

    printf("Enter a number: ");
    if (fgets(str, sizeof(str), stdin) != NULL) {
        if (sscanf(str, "%d%c", &num, &term) != 2 || term != '\\n') {
            printf("That's not a valid number!\\n");
        } else {
            printf("You entered the number: %d\\n", num);
        }
    }
    return 0;
}
`,
  cpp: `#include <iostream>
#include <string>
#include <limits>

int main() {
    int number;
    std::cout << "Enter a number: ";
    std::cin >> number;

    if (std::cin.fail()) {
        std::cout << "That's not a valid number!" << std::endl;
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\\n');
    } else {
        std::cout << "You entered the number: " << number << std::endl;
    }

    return 0;
}
`,
};
