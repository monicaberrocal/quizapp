import { useState, useEffect } from "react";
import api from "../api";

const useFetch = (url, method = "GET", body = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;
        if (method === "GET") {
          response = await api.get(url, { withCredentials: true });
        } else if (method === "POST") {
          response = await api.post(url, body, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          });
        }
        setData(response.data);
      } catch (err) {
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, method, body]);

  return { data, loading, error };
};

export default useFetch;
