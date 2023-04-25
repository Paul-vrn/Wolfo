import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Text } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Error, NewUser } from "types";
import { setToken } from "../../utils/api/api";
import { login } from "../../utils/api/user";
import { AuthContext } from "../context/tokenContext";
export const Login = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { handleSetToken } = useContext(AuthContext);
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { mutate, isError, error } = useMutation<any, Error, NewUser>({
    mutationFn: user => login(user),
    onSuccess: async data => {
      setToken(data.token);
      handleSetToken(data.token);
      await queryClient.invalidateQueries(["token"]);
      router.replace("/");
    },
  });
  const handleLogin = () => {
    const user: NewUser = {
      name,
      password,
    };
    mutate(user);
  };
  return (
    <SafeAreaView style={styles.container}>
      <Input placeholder="Username" onChangeText={setName} />
      <Input placeholder="Password" onChangeText={setPassword} style={styles.passwordInput} />
      <Button onPress={handleLogin} style={styles.button}>
        Login
      </Button>
      {isError && <Text>{error.message}</Text>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: "hidden",
  },
  button: {
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
});
