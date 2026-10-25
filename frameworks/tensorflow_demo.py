"""Optional TensorFlow toy model on generated numeric data only."""
import numpy as np
import tensorflow as tf
def build_model(window=8):
 tf.keras.utils.set_random_seed(42);m=tf.keras.Sequential([tf.keras.layers.Input(shape=(window,)),tf.keras.layers.Dense(16,activation="relu"),tf.keras.layers.Dense(1)]);m.compile(optimizer="adam",loss="mse");return m
def main():
 x=np.arange(120,dtype=np.float32);v=(25+.2*x+4*np.sin(x/5)).astype(np.float32);w=8
 a=np.stack([v[i:i+w] for i in range(len(v)-w)]);b=np.array([v[i+w] for i in range(len(v)-w)])
 m=build_model(w);m.fit(a,b,epochs=2,verbose=0);print(float(m.predict(v[-w:].reshape(1,-1),verbose=0)[0,0]))
if __name__=="__main__":main()
