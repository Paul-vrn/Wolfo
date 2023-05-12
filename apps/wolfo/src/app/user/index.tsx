import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Text } from "@ui-kitten/components";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Error, User } from "types";
import { AuthContext } from "../../components/context/tokenContext";
import { setToken } from "../../utils/api/api";
import { deleteUser, updateUser } from "../../utils/api/user";

const Settings = () => {
  const { name: defaultName, id, handleSetToken } = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [name, setName] = useState<string>(defaultName);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const router = useRouter();
  const { token } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { mutate: updateQuery } = useMutation<any, Error, User>({
    mutationFn: userUpdated => updateUser(userUpdated),
    onSuccess: data => {
      handleSetToken(data.token);
      setErrorMessage("");
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });
  const { mutate: deleteQuery } = useMutation<any, Error>({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setToken(null);
      await queryClient.invalidateQueries();
      router.back();
    },
  });
  const logout = async () => {
    setToken(null);
    await queryClient.invalidateQueries();
    router.back();
  };
  const handleModify = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    await queryClient.invalidateQueries(["token"]);
    updateQuery({ id, name, password });
  };

  return (
    <SafeAreaView>
      <Text>{name}'s settings</Text>
      <Input placeholder="Username" onChangeText={setName} testID="update-username-input" />
      <Input placeholder="Password" onChangeText={setPassword} testID="update-password-input" />
      <Input
        placeholder="Confirm password"
        onChangeText={setConfirmPassword}
        testID="confirm-update-password-input"
      />

      <Button onPress={handleModify} testID="update-account-button">
        Modifier le compte
      </Button>
      <Button onPress={() => deleteQuery()} testID="delete-account-button">
        Supprimer le compte
      </Button>
      <Button onPress={() => logout()} testID="logout-button">
        Se déconnecter
      </Button>
      {errorMessage && <Text>{errorMessage}</Text>}
      <Text>Token: {token}</Text>
    </SafeAreaView>
  );
};

export default Settings;
