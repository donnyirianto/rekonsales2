import axios from "axios";

export const query = async (query) => {
  try {
    const result = await axios.post('http://192.168.131.18:7272/api/v1/mysql/query', {query : query}) 
    
    return result.data.data[0]
  } catch (error) {   
    
    throw error
  }
} 
