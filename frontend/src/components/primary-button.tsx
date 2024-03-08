import { Button, ButtonProps, Spinner } from "@chakra-ui/react";

interface PrimaryButtonProps extends ButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}
export function PrimaryButton({
  onClick,
  isLoading = false,
  isDisabled = false,
  ...props
}: PrimaryButtonProps) {
  return (
    <>
      <Button
        onClick={onClick}
        isDisabled={isLoading || isDisabled}
        borderRadius="20px"
        colorScheme="blue"
        width="100%"
        height="50px"
        cursor={isDisabled ? "not-allowed" : "pointer"}
        whiteSpace="break-spaces"
        {...props}
      >
        {isLoading ? <Spinner /> : props.children}
      </Button>
    </>
  );
}
