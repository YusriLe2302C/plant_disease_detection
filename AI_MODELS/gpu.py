import tensorflow as tf
print("GPUs:", tf.config.list_physical_devices('GPU'))

print("TensorFlow:", tf.__version__)
print("Built with CUDA:", tf.test.is_built_with_cuda())
print("GPU devices:", tf.config.list_physical_devices('GPU'))